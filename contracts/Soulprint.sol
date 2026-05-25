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
    mapping(uint256 => uint8)   public stageOf;       // tokenId -> evolution stage 1..10
    mapping(uint256 => uint8)   public formIdOf;      // tokenId -> spirit form 1..30 (see _formSlug)
    mapping(address => uint256) public paidByWallet;  // escrowed mint amount
    mapping(address => bool)    public pendingRead;   // wallet -> a pipeline is in flight
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
    event RefundFailed(address indexed wallet, uint256 amount);

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

    /// @notice Owner escape hatch: clear a stuck `pendingRead` flag if an agent request
    /// never returns, so the wallet isn't locked out of future reads. The platform
    /// normally delivers every status (Success/Failed/TimedOut), so this is rarely needed.
    function clearPending(address wallet) external {
        require(msg.sender == owner, "not owner");
        pendingRead[wallet] = false;
    }

    // ──────────────────────────────────────────────
    // Entry points
    // ──────────────────────────────────────────────

    /// @notice First read of a wallet: kicks off the agent pipeline, mints on completion.
    function read(address wallet) external payable {
        require(wallet != address(0), "zero wallet");
        require(soulprintOf[wallet] == 0, "already read");
        require(!pendingRead[wallet], "read in progress");
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
        require(!pendingRead[holder], "read in progress");
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
        pendingRead[wallet] = true;
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
            pendingRead[ctx.wallet] = false;
            emit ReadFailed(ctx.wallet, "stats");
            return;
        }
        uint256 txCount = abi.decode(responses[0].result, (uint256));

        // Cost-gated evolution: for an existing soulprint, only re-run the (expensive) LLM
        // and bump `generation` when the wallet's on-chain activity actually changed. The LLM
        // is deterministic, so an unchanged tx count would just reproduce the same dossier.
        uint256 existingId = soulprintOf[ctx.wallet];
        if (existingId != 0 && txCount == txCountOf[existingId]) {
            pendingRead[ctx.wallet] = false;
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
            pendingRead[ctx.wallet] = false;
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
            if (paid > 0 && freeMintsRemaining > 0) {
                // Refund the free mint, but never let a rejecting recipient (a contract
                // minter with no payable receive) or a momentarily thin reserve revert the
                // whole mint. Consume a free slot only if the refund actually lands.
                (bool ok, ) = payable(ctx.wallet).call{value: paid}("");
                if (ok) freeMintsRemaining -= 1;
                else emit RefundFailed(ctx.wallet, paid);
            }
        }
        dossier[tokenId] = text;
        txCountOf[tokenId] = ctx.txCount;
        generation[tokenId] += 1;
        lastUpdated[tokenId] = block.timestamp;
        // Derive on-chain stage (1..10 from tx_count) and form (1..30 from archetype+stage) so
        // they're verifiable + composable for other contracts/agents, not just the LLM text.
        uint8 newStage = _stageFromTxCount(ctx.txCount);
        uint8 archIdx = _archetypeIdx(_extractField(text, "ARCHETYPE:"));
        stageOf[tokenId] = newStage;
        formIdOf[tokenId] = _formIdFor(archIdx, newStage);
        pendingRead[ctx.wallet] = false;
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

    /// @notice Evolution stage (1..10) for a token — derived from on-chain tx_count buckets.
    /// Higher tx_count ⇒ higher stage (Dormant → Eternal). Verifiable, no LLM needed.
    /// Combined with the LLM-assigned archetype it picks the spirit form (`formIdOf`).
    /// @notice Spirit form id (1..30) — see `formSlugOf` for the human-readable slug.
    /// Form = lookup(archetype, stage) per the design spec; each of 7 archetype lines
    /// branches into a few forms gated by stage threshold.
    function formSlugOf(uint256 tokenId) public view returns (string memory) {
        _requireOwned(tokenId);
        return _formSlug(formIdOf[tokenId]);
    }

    /// @notice Composable evolution view for other contracts/agents: stage, formId, formSlug.
    function evolutionOf(address wallet)
        external
        view
        returns (uint8 stage, uint8 formId, string memory formSlug)
    {
        uint256 tokenId = soulprintOf[wallet];
        if (tokenId == 0) return (0, 0, "");
        uint8 fid = formIdOf[tokenId];
        return (stageOf[tokenId], fid, _formSlug(fid));
    }

    /// @dev tx_count → evolution stage (1..10). Thresholds tuned for typical on-chain
    /// magnitudes; lower bounds friendly to testnet wallets (Stage 2 at ≥5 tx).
    function _stageFromTxCount(uint256 txc) internal pure returns (uint8) {
        if (txc >= 200000) return 10;
        if (txc >= 50000)  return 9;
        if (txc >= 10000)  return 8;
        if (txc >= 2000)   return 7;
        if (txc >= 600)    return 6;
        if (txc >= 200)    return 5;
        if (txc >= 75)     return 4;
        if (txc >= 20)     return 3;
        if (txc >= 5)      return 2;
        return 1;
    }

    /// @dev Canonical archetype string → index 1..7 (0 = unknown). Mirrors the 7 lines.
    function _archetypeIdx(string memory s) internal pure returns (uint8) {
        bytes32 h = keccak256(bytes(s));
        if (h == keccak256(bytes("Newborn Wallet")))    return 1;
        if (h == keccak256(bytes("Testnet Explorer")))  return 2;
        if (h == keccak256(bytes("DeFi User")))         return 3;
        if (h == keccak256(bytes("NFT Collector")))     return 4;
        if (h == keccak256(bytes("Contract Deployer"))) return 5;
        if (h == keccak256(bytes("Sybil-Like Farmer"))) return 6;
        if (h == keccak256(bytes("Power User")))        return 7;
        return 0;
    }

    /// @dev FORM_TABLE[archetype][stage] → formId. Each archetype has an evolution line
    /// whose forms are gated by stage thresholds (highest reached form wins). See
    /// docs/specs/2026-05-23-soul-evolution-system.md §4.
    function _formIdFor(uint8 arch, uint8 stage) internal pure returns (uint8) {
        if (arch == 1 || arch == 0) { // Newborn (also fallback for unknown)
            if (stage >= 3) return 3;
            if (stage >= 2) return 2;
            return 1;
        }
        if (arch == 2) { // Testnet Explorer
            if (stage >= 6) return 7;
            if (stage >= 5) return 6;
            if (stage >= 3) return 5;
            return 4;
        }
        if (arch == 3) { // DeFi User
            if (stage >= 9) return 12;
            if (stage >= 8) return 11;
            if (stage >= 6) return 10;
            if (stage >= 4) return 9;
            return 8;
        }
        if (arch == 4) { // NFT Collector
            if (stage >= 8) return 16;
            if (stage >= 6) return 15;
            if (stage >= 4) return 14;
            return 13;
        }
        if (arch == 5) { // Contract Deployer
            if (stage >= 10) return 21;
            if (stage >= 9)  return 20;
            if (stage >= 7)  return 19;
            if (stage >= 5)  return 18;
            return 17;
        }
        if (arch == 6) { // Sybil-Like Farmer
            if (stage >= 7) return 25;
            if (stage >= 6) return 24;
            if (stage >= 4) return 23;
            return 22;
        }
        if (arch == 7) { // Power User
            if (stage >= 10) return 30;
            if (stage >= 9)  return 29;
            if (stage >= 8)  return 28;
            if (stage >= 7)  return 27;
            return 26;
        }
        return 1;
    }

    /// @dev formId → slug. Matches the asset filenames in web/public/souls/<slug>.png.
    function _formSlug(uint8 formId) internal pure returns (string memory) {
        if (formId == 1)  return "newborn-1-spark-mote";
        if (formId == 2)  return "newborn-2-drifting-wisp";
        if (formId == 3)  return "newborn-3-ember-shade";
        if (formId == 4)  return "explorer-1-seeker-wisp";
        if (formId == 5)  return "explorer-2-pathfinder-shade";
        if (formId == 6)  return "explorer-3-cartographer-spirit";
        if (formId == 7)  return "explorer-4-voidwalker";
        if (formId == 8)  return "defi-1-liquidity-sprite";
        if (formId == 9)  return "defi-2-yield-wraith";
        if (formId == 10) return "defi-3-flux-specter";
        if (formId == 11) return "defi-4-market-phantom";
        if (formId == 12) return "defi-5-leviathan";
        if (formId == 13) return "nft-1-curio-imp";
        if (formId == 14) return "nft-2-gallery-shade";
        if (formId == 15) return "nft-3-aesthete-spirit";
        if (formId == 16) return "nft-4-curator-sovereign";
        if (formId == 17) return "deployer-1-glyph-sprite";
        if (formId == 18) return "deployer-2-architect-shade";
        if (formId == 19) return "deployer-3-forge-specter";
        if (formId == 20) return "deployer-4-protocol-wright";
        if (formId == 21) return "deployer-5-genesis-demiurge";
        if (formId == 22) return "sybil-1-husk-mote";
        if (formId == 23) return "sybil-2-mirror-shade";
        if (formId == 24) return "sybil-3-swarm-wraith";
        if (formId == 25) return "sybil-4-hydra-of-husks";
        if (formId == 26) return "power-1-adept-spirit";
        if (formId == 27) return "power-2-ascendant-shade";
        if (formId == 28) return "power-3-sovereign-specter";
        if (formId == 29) return "power-4-aetherlord";
        if (formId == 30) return "power-5-soul-singularity";
        return "";
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
            if (!pendingRead[wallet] && address(this).balance >= needed) {
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
                '{"trait_type":"Stage","value":', Strings.toString(uint256(stageOf[tokenId])), '},',
                '{"trait_type":"Form","value":', _jsonString(_formSlug(formIdOf[tokenId])), '},',
                '{"trait_type":"Generation","value":', gen, '}',
            '],"dossier":', _jsonString(dossier[tokenId]), '}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _jsonString(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        bytes memory out = abi.encodePacked('"');
        bytes16 hexChars = "0123456789abcdef";
        for (uint256 i = 0; i < b.length; i++) {
            uint8 v = uint8(b[i]);
            bytes1 c = b[i];
            if (c == '"') out = abi.encodePacked(out, '\\"');
            else if (c == "\\") out = abi.encodePacked(out, "\\\\");
            else if (c == "\n") out = abi.encodePacked(out, "\\n");
            else if (c == "\r") out = abi.encodePacked(out, "\\r");
            else if (c == "\t") out = abi.encodePacked(out, "\\t");
            else if (v < 0x20) {
                // Any other JSON control char (U+0000–U+001F) must be \u-escaped or the
                // metadata is invalid JSON. (RFC 8259 §7.)
                out = abi.encodePacked(out, "\\u00", hexChars[v >> 4], hexChars[v & 0x0f]);
            } else {
                out = abi.encodePacked(out, c);
            }
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
