// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {
    IAgentRequester, IJsonApiAgent, ILLMAgent,
    Response, Request, ResponseStatus
} from "./interfaces/ISomniaAgents.sol";

/// @title PERSONA — a self-updating dynamic NFT.
/// @notice Reads a wallet's on-chain activity via Somnia Agents, has an on-chain
/// LLM write a witty "personality dossier", and mints it as a soulbound NFT.
contract Persona is ERC721 {
    IAgentRequester public immutable platform;

    uint256 public constant JSON_API_AGENT_ID = 13174292974160097713;
    uint256 public constant LLM_AGENT_ID = 12847293847561029384;
    uint256 public constant SUBCOMMITTEE = 3;
    uint256 public constant JSON_PRICE_PER_AGENT = 0.03 ether;
    uint256 public constant LLM_PRICE_PER_AGENT = 0.07 ether;
    uint256 public constant MINT_PRICE = 1 ether;

    enum Stage { None, Stats, Dossier }

    struct Ctx {
        address wallet;
        Stage stage;
        bool active;
    }

    mapping(uint256 => Ctx) internal requests; // agent requestId -> ctx

    mapping(address => uint256) public personaOf;     // wallet -> tokenId (0 = none)
    mapping(uint256 => string)  public dossier;       // tokenId -> dossier text
    mapping(uint256 => uint256) public generation;    // tokenId -> version
    mapping(uint256 => uint256) public lastUpdated;   // tokenId -> timestamp
    mapping(address => uint256) public paidByWallet;  // escrowed mint amount
    address[] public registeredWallets;
    uint256 public totalPersonas;
    uint256 public freeMintsRemaining = 100;

    event ReadFailed(address indexed wallet, string stage);
    event PersonaMinted(address indexed wallet, uint256 indexed tokenId);
    event DossierUpdated(uint256 indexed tokenId, uint256 generation);
    event Locked(uint256 tokenId);
    event ProfileRequested(address indexed requester, address indexed wallet);

    constructor(address platform_) ERC721("Persona", "PERSONA") {
        platform = IAgentRequester(platform_);
    }

    // ──────────────────────────────────────────────
    // Entry points
    // ──────────────────────────────────────────────

    /// @notice First read of a wallet: kicks off the agent pipeline, mints on completion.
    function read(address wallet) external payable {
        require(msg.value >= MINT_PRICE, "underpaid");
        require(personaOf[wallet] == 0, "already read");
        paidByWallet[wallet] = msg.value;
        emit ProfileRequested(msg.sender, wallet);
        _requestStats(wallet);
    }

    /// @notice Re-run the pipeline for an existing NFT to refresh its dossier.
    function reread(uint256 tokenId) external {
        address owner = _requireOwned(tokenId);
        require(msg.sender == owner, "not owner");
        emit ProfileRequested(msg.sender, owner);
        _requestStats(owner);
    }

    /// @notice One-call profile read for other contracts/agents to compose on.
    function profileOf(address wallet)
        external
        view
        returns (uint256 tokenId, string memory dossierText, uint256 gen)
    {
        tokenId = personaOf[wallet];
        if (tokenId != 0) {
            dossierText = dossier[tokenId];
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
        requests[id] = Ctx(wallet, Stage.Stats, true);
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
        _requestDossier(ctx.wallet, txCount);
    }

    function _requestDossier(address wallet, uint256 txCount) internal {
        string memory sys =
            "You are PERSONA, a witty on-chain analyst. Be clever and a little roasty, "
            "but never hateful: no slurs, never target real-world identity, religion, or "
            "ethnicity. Roast on-chain behavior only. Output EXACTLY the template. One line per field.";
        string memory prompt = string.concat(
            "Wallet: ", Strings.toHexString(uint160(wallet), 20),
            "\nOn-chain stats (Somnia Shannon testnet):",
            "\n- Total transactions: ", Strings.toString(txCount),
            "\n\nWrite the dossier in EXACTLY this format:\n"
            "TYPE: <archetype>, Type <I-V>\n"
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
        requests[id] = Ctx(wallet, Stage.Dossier, true);
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

        uint256 tokenId = personaOf[ctx.wallet];
        if (tokenId == 0) {
            tokenId = ++totalPersonas;
            personaOf[ctx.wallet] = tokenId;
            registeredWallets.push(ctx.wallet);
            _safeMint(ctx.wallet, tokenId);
            emit PersonaMinted(ctx.wallet, tokenId);
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
        generation[tokenId] += 1;
        lastUpdated[tokenId] = block.timestamp;
        emit DossierUpdated(tokenId, generation[tokenId]);
    }

    // ──────────────────────────────────────────────
    // Dynamic metadata
    // ──────────────────────────────────────────────

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory json = string.concat(
            '{"name":"Persona #', Strings.toString(tokenId),
            '","description":"On-chain personality dossier, generation ',
            Strings.toString(generation[tokenId]),
            '","attributes":[{"trait_type":"Generation","value":',
            Strings.toString(generation[tokenId]),
            '}],"dossier":', _jsonString(dossier[tokenId]), '}'
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
