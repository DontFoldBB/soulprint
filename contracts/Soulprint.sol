// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {
    IAgentRequester, IJsonApiAgent, ILLMAgent,
    Response, Request, ResponseStatus
} from "./interfaces/ISomniaAgents.sol";

/// @title Soulprint — a self-updating dynamic NFT.
/// @notice Reads a wallet's on-chain activity via Somnia Agents, has an on-chain
/// LLM write a witty "identity dossier", and mints it as a soulbound NFT.
contract Soulprint is ERC721 {
    IAgentRequester public immutable platform;
    address public immutable owner;

    uint256 public constant JSON_API_AGENT_ID = 13174292974160097713;
    uint256 public constant LLM_AGENT_ID = 12847293847561029384;
    uint256 public constant SUBCOMMITTEE = 3;
    uint256 public constant JSON_PRICE_PER_AGENT = 0.03 ether;
    uint256 public constant LLM_PRICE_PER_AGENT = 0.07 ether;
    uint256 public constant MINT_PRICE = 1 ether;            // profiling your OWN wallet
    uint256 public constant PROFILE_OTHER_PRICE = 2 ether;   // profiling someone else's wallet

    enum Stage { None, Stats, Dossier }

    struct Ctx {
        address wallet;
        Stage stage;
        bool active;
        uint256 txCount;
    }

    mapping(uint256 => Ctx) internal requests; // agent requestId -> ctx

    mapping(address => uint256) public soulprintOf;   // wallet -> tokenId (0 = none)
    mapping(uint256 => string)  public dossier;       // tokenId -> dossier text
    mapping(uint256 => uint256) public txCountOf;     // tokenId -> tx count at last update
    mapping(uint256 => uint256) public generation;    // tokenId -> version
    mapping(uint256 => uint256) public lastUpdated;   // tokenId -> timestamp
    mapping(address => uint256) public paidByWallet;  // escrowed mint amount
    address[] public registeredWallets;
    uint256 public totalSoulprints;
    uint256 public freeMintsRemaining = 100;
    uint256 public evolveCursor;                      // round-robin pointer for evolveBatch

    event ReadFailed(address indexed wallet, string stage);
    event SoulprintMinted(address indexed wallet, uint256 indexed tokenId);
    event DossierUpdated(uint256 indexed tokenId, uint256 generation);
    event Locked(uint256 tokenId);
    event ProfileRequested(address indexed requester, address indexed wallet);
    event EvolutionSkipped(uint256 indexed tokenId);

    constructor(address platform_) ERC721("Soulprint", "SOUL") {
        platform = IAgentRequester(platform_);
        owner = msg.sender;
    }

    /// @notice Owner-only sweep of the contract's STT reserve. Lets us recycle the
    /// agent-call / Reactivity-subscription reserve into the next deployment instead
    /// of re-funding from scratch on every redeploy.
    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "not owner");
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "withdraw failed");
    }

    // ──────────────────────────────────────────────
    // Entry points
    // ──────────────────────────────────────────────

    /// @notice First read of a wallet: kicks off the agent pipeline, mints on completion.
    function read(address wallet) external payable {
        require(soulprintOf[wallet] == 0, "already read");
        bool isSelf = wallet == msg.sender;
        require(msg.value >= (isSelf ? MINT_PRICE : PROFILE_OTHER_PRICE), "underpaid");
        // Only self-mints are refund-eligible (first 100). Profiling someone else is paid
        // (the soulbound NFT still mints to `wallet`, not to the payer).
        paidByWallet[wallet] = isSelf ? msg.value : 0;
        emit ProfileRequested(msg.sender, wallet);
        _requestStats(wallet);
    }

    /// @notice Re-run the pipeline for an existing NFT to refresh its dossier.
    function reread(uint256 tokenId) external {
        address holder = _requireOwned(tokenId);
        require(msg.sender == holder, "not owner");
        emit ProfileRequested(msg.sender, holder);
        _requestStats(holder);
    }

    /// @notice One-call profile read for other contracts/agents to compose on.
    function profileOf(address wallet)
        external
        view
        returns (uint256 tokenId, string memory dossierText, uint256 gen)
    {
        tokenId = soulprintOf[wallet];
        if (tokenId != 0) {
            dossierText = dossier[tokenId];
            gen = generation[tokenId];
        }
    }

    /// @notice Machine-readable traits for other contracts/agents: canonical
    /// archetype + on-chain activity score + generation. Zeros if unprofiled.
    function traitsOf(address wallet)
        external
        view
        returns (uint256 tokenId, string memory archetype, uint256 activity, uint256 gen)
    {
        tokenId = soulprintOf[wallet];
        if (tokenId != 0) {
            archetype = archetypeOf(tokenId);
            activity = activityScore(tokenId);
            gen = generation[tokenId];
        }
    }

    // ──────────────────────────────────────────────
    // Agent pipeline
    // ──────────────────────────────────────────────

    function _requestStats(address wallet) internal {
        string memory url = string.concat(
            "https://shannon-explorer.somnia.network/api/v2/addresses/",
            Strings.toHexString(uint160(wallet), 20),
            "/counters"
        );
        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchUint.selector, url, "transactions_count", uint8(0)
        );
        uint256 deposit = platform.getRequestDeposit() + JSON_PRICE_PER_AGENT * SUBCOMMITTEE;
        uint256 id = platform.createRequest{value: deposit}(
            JSON_API_AGENT_ID, address(this), this.handleStats.selector, payload
        );
        requests[id] = Ctx(wallet, Stage.Stats, true, 0);
    }

    function handleStats(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "only platform");
        Ctx memory ctx = requests[requestId];
        require(ctx.active, "unknown request");
        delete requests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit ReadFailed(ctx.wallet, "stats");
            return;
        }
        uint256 txCount = abi.decode(responses[0].result, (uint256));

        // Cost-gated evolution: for an existing soulprint, only re-run the (expensive) LLM
        // and bump `generation` when the wallet's on-chain activity actually changed. The LLM
        // is deterministic, so an unchanged tx count would just reproduce the same dossier.
        uint256 existingId = soulprintOf[ctx.wallet];
        if (existingId != 0 && txCount == txCountOf[existingId]) {
            emit EvolutionSkipped(existingId);
            return;
        }

        _requestDossier(ctx.wallet, txCount);
    }

    function _requestDossier(address wallet, uint256 txCount) internal {
        string memory sys =
            "You are Soulprint, a witty on-chain analyst. Be clever and a little roasty, "
            "but never hateful: no slurs, never target real-world identity, religion, or "
            "ethnicity. Roast on-chain behavior only. Output EXACTLY the template. One line per field.";
        string memory prompt = string.concat(
            "Wallet: ", Strings.toHexString(uint160(wallet), 20),
            "\nOn-chain stats (Somnia Shannon testnet):",
            "\n- Total transactions: ", Strings.toString(txCount),
            "\n\nWrite the dossier in EXACTLY this format. TYPE must be a made-up 2-4 word "
            "archetype NAME (invent one, e.g. 'The Ghost', 'Serial Aper', 'Gas Goblin'), "
            "then a comma, then 'Type' and a roman numeral I-V. ARCHETYPE must be the single "
            "best fit from the fixed list, copied EXACTLY:\n"
            "TYPE: <archetype name>, Type <I-V>\n"
            "ARCHETYPE: <one of: Newborn Wallet | Testnet Explorer | DeFi User | NFT Collector "
            "| Contract Deployer | Sybil-Like Farmer | Power User>\n"
            "STRENGTH: <one line>\n"
            "WEAKNESS: <one line>\n"
            "STYLE: \"<short quote>\"\n"
            "KARMA: <signed number>\n"
            "NOTES: <1-2 witty sentences>\n"
            "RARITY: <1-5>"
        );
        string[] memory none = new string[](0);
        bytes memory payload = abi.encodeWithSelector(
            ILLMAgent.inferString.selector, prompt, sys, false, none
        );
        uint256 deposit = platform.getRequestDeposit() + LLM_PRICE_PER_AGENT * SUBCOMMITTEE;
        uint256 id = platform.createRequest{value: deposit}(
            LLM_AGENT_ID, address(this), this.handleDossier.selector, payload
        );
        requests[id] = Ctx(wallet, Stage.Dossier, true, txCount);
    }

    function handleDossier(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        require(msg.sender == address(platform), "only platform");
        Ctx memory ctx = requests[requestId];
        require(ctx.active, "unknown request");
        delete requests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit ReadFailed(ctx.wallet, "dossier");
            return;
        }
        string memory text = abi.decode(responses[0].result, (string));

        uint256 tokenId = soulprintOf[ctx.wallet];
        if (tokenId == 0) {
            tokenId = ++totalSoulprints;
            soulprintOf[ctx.wallet] = tokenId;
            registeredWallets.push(ctx.wallet);
            _mint(ctx.wallet, tokenId); // _mint (not _safeMint): soulprints may target contract addresses too; token is soulbound
            emit SoulprintMinted(ctx.wallet, tokenId);
            emit Locked(tokenId);

            uint256 paid = paidByWallet[ctx.wallet];
            delete paidByWallet[ctx.wallet];
            if (freeMintsRemaining > 0 && paid > 0) {
                freeMintsRemaining -= 1;
                (bool ok, ) = payable(ctx.wallet).call{value: paid}("");
                require(ok, "refund failed");
            }
        }
        dossier[tokenId] = text;
        txCountOf[tokenId] = ctx.txCount;
        generation[tokenId] += 1;
        lastUpdated[tokenId] = block.timestamp;
        emit DossierUpdated(tokenId, generation[tokenId]);
    }

    /// @notice Deterministic, hallucination-free activity score (0–100) derived
    /// on-chain from the wallet's transaction count. Machine-readable for agents.
    function activityScore(uint256 tokenId) public view returns (uint256) {
        _requireOwned(tokenId);
        uint256 n = txCountOf[tokenId];
        if (n == 0) return 0;
        if (n < 10) return 20;
        if (n < 50) return 40;
        if (n < 200) return 60;
        if (n < 1000) return 80;
        return 100;
    }

    /// @notice The canonical archetype the LLM assigned (parsed from the dossier's
    /// `ARCHETYPE:` line). Empty string if absent. Machine-readable for agents.
    function archetypeOf(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);
        return _extractField(dossier[tokenId], "ARCHETYPE:");
    }

    /// @dev Tolerant single-line field extractor: returns the trimmed text after the
    /// first occurrence of `label` up to the next newline, or "" if not found.
    function _extractField(string memory text, string memory label)
        internal
        pure
        returns (string memory)
    {
        bytes memory t = bytes(text);
        bytes memory l = bytes(label);
        if (l.length == 0 || t.length < l.length) return "";

        uint256 pos = type(uint256).max;
        for (uint256 i = 0; i + l.length <= t.length; i++) {
            bool matched = true;
            for (uint256 j = 0; j < l.length; j++) {
                if (t[i + j] != l[j]) { matched = false; break; }
            }
            if (matched) { pos = i + l.length; break; }
        }
        if (pos == type(uint256).max) return "";

        while (pos < t.length && t[pos] == 0x20) pos++;          // skip leading spaces
        uint256 end = pos;
        while (end < t.length && t[end] != 0x0a && t[end] != 0x0d) end++; // until newline
        while (end > pos && t[end - 1] == 0x20) end--;           // trim trailing spaces

        bytes memory out = new bytes(end - pos);
        for (uint256 k = 0; k < out.length; k++) out[k] = t[pos + k];
        return string(out);
    }

    // ──────────────────────────────────────────────
    // Autonomous evolution
    // ──────────────────────────────────────────────

    /// @notice Permissionless tick: re-runs the read→dossier pipeline for up to
    /// `count` registered wallets, round-robin via `evolveCursor`. Invoked by the
    /// Cron handler (autonomous) or by anyone as a fallback. Skips a wallet (no revert)
    /// when the reserve can't fund a full pipeline, so a tick never half-fails.
    function evolveBatch(uint256 count) public {
        uint256 total = registeredWallets.length;
        if (total == 0) return;
        if (count > total) count = total;

        uint256 needed = 2 * platform.getRequestDeposit()
            + (JSON_PRICE_PER_AGENT + LLM_PRICE_PER_AGENT) * SUBCOMMITTEE;

        uint256 cursor = evolveCursor;
        for (uint256 i = 0; i < count; i++) {
            address wallet = registeredWallets[cursor];
            if (address(this).balance >= needed) {
                _requestStats(wallet); // handleDossier updates in place (soulprintOf != 0)
            } else {
                emit EvolutionSkipped(soulprintOf[wallet]);
            }
            cursor = cursor + 1 >= total ? 0 : cursor + 1;
        }
        evolveCursor = cursor;
    }

    // ──────────────────────────────────────────────
    // Dynamic metadata
    // ──────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory gen = Strings.toString(generation[tokenId]);
        string memory json = string.concat(
            '{"name":"Soulprint #', Strings.toString(tokenId),
            '","description":"On-chain identity dossier, generation ', gen,
            '","attributes":[',
                '{"trait_type":"Archetype","value":', _jsonString(archetypeOf(tokenId)), '},',
                '{"trait_type":"Activity","value":', Strings.toString(activityScore(tokenId)), '},',
                '{"trait_type":"Generation","value":', gen, '}',
            '],"dossier":', _jsonString(dossier[tokenId]), '}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _jsonString(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = abi.encodePacked('"');
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c == '"') out = abi.encodePacked(out, '\\"');
            else if (c == "\\") out = abi.encodePacked(out, "\\\\");
            else if (c == "\n") out = abi.encodePacked(out, "\\n");
            else out = abi.encodePacked(out, c);
        }
        return string(abi.encodePacked(out, '"'));
    }

    // ──────────────────────────────────────────────
    // Soulbound (ERC-5192 minimal)
    // ──────────────────────────────────────────────

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("soulbound");
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e /* ERC-5192 */ || super.supportsInterface(interfaceId);
    }

    receive() external payable {}
}
