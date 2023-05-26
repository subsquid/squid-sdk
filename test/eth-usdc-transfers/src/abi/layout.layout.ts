export const LAYOUT_JSON = {
    "storage": [
        {
            "astId": 298,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "_owner",
            "offset": 0,
            "slot": "0",
            "type": "t_address"
        },
        {
            "astId": 391,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "pauser",
            "offset": 0,
            "slot": "1",
            "type": "t_address"
        },
        {
            "astId": 394,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "paused",
            "offset": 20,
            "slot": "1",
            "type": "t_bool"
        },
        {
            "astId": 480,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "blacklister",
            "offset": 0,
            "slot": "2",
            "type": "t_address"
        },
        {
            "astId": 484,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "blacklisted",
            "offset": 0,
            "slot": "3",
            "type": "t_mapping(t_address,t_bool)"
        },
        {
            "astId": 617,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "name",
            "offset": 0,
            "slot": "4",
            "type": "t_string_storage"
        },
        {
            "astId": 619,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "symbol",
            "offset": 0,
            "slot": "5",
            "type": "t_string_storage"
        },
        {
            "astId": 621,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "decimals",
            "offset": 0,
            "slot": "6",
            "type": "t_uint8"
        },
        {
            "astId": 623,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "currency",
            "offset": 0,
            "slot": "7",
            "type": "t_string_storage"
        },
        {
            "astId": 625,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "masterMinter",
            "offset": 0,
            "slot": "8",
            "type": "t_address"
        },
        {
            "astId": 627,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "initialized",
            "offset": 20,
            "slot": "8",
            "type": "t_bool"
        },
        {
            "astId": 631,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "balances",
            "offset": 0,
            "slot": "9",
            "type": "t_mapping(t_address,t_uint256)"
        },
        {
            "astId": 637,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "allowed",
            "offset": 0,
            "slot": "10",
            "type": "t_mapping(t_address,t_mapping(t_address,t_uint256))"
        },
        {
            "astId": 640,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "totalSupply_",
            "offset": 0,
            "slot": "11",
            "type": "t_uint256"
        },
        {
            "astId": 644,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "minters",
            "offset": 0,
            "slot": "12",
            "type": "t_mapping(t_address,t_bool)"
        },
        {
            "astId": 648,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "minterAllowed",
            "offset": 0,
            "slot": "13",
            "type": "t_mapping(t_address,t_uint256)"
        },
        {
            "astId": 1788,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "_rescuer",
            "offset": 0,
            "slot": "14",
            "type": "t_address"
        },
        {
            "astId": 2040,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "DOMAIN_SEPARATOR",
            "offset": 0,
            "slot": "15",
            "type": "t_bytes32"
        },
        {
            "astId": 2063,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "_authorizationStates",
            "offset": 0,
            "slot": "16",
            "type": "t_mapping(t_address,t_mapping(t_bytes32,t_bool))"
        },
        {
            "astId": 2379,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "_permitNonces",
            "offset": 0,
            "slot": "17",
            "type": "t_mapping(t_address,t_uint256)"
        },
        {
            "astId": 2464,
            "contract": "contracts/2_Owner.sol:FiatTokenV2",
            "label": "_initializedVersion",
            "offset": 0,
            "slot": "18",
            "type": "t_uint8"
        }
    ],
    "types": {
        "t_address": {
            "encoding": "inplace",
            "label": "address",
            "numberOfBytes": "20"
        },
        "t_bool": {
            "encoding": "inplace",
            "label": "bool",
            "numberOfBytes": "1"
        },
        "t_bytes32": {
            "encoding": "inplace",
            "label": "bytes32",
            "numberOfBytes": "32"
        },
        "t_mapping(t_address,t_bool)": {
            "encoding": "mapping",
            "key": "t_address",
            "label": "mapping(address => bool)",
            "numberOfBytes": "32",
            "value": "t_bool"
        },
        "t_mapping(t_address,t_mapping(t_address,t_uint256))": {
            "encoding": "mapping",
            "key": "t_address",
            "label": "mapping(address => mapping(address => uint256))",
            "numberOfBytes": "32",
            "value": "t_mapping(t_address,t_uint256)"
        },
        "t_mapping(t_address,t_mapping(t_bytes32,t_bool))": {
            "encoding": "mapping",
            "key": "t_address",
            "label": "mapping(address => mapping(bytes32 => bool))",
            "numberOfBytes": "32",
            "value": "t_mapping(t_bytes32,t_bool)"
        },
        "t_mapping(t_address,t_uint256)": {
            "encoding": "mapping",
            "key": "t_address",
            "label": "mapping(address => uint256)",
            "numberOfBytes": "32",
            "value": "t_uint256"
        },
        "t_mapping(t_bytes32,t_bool)": {
            "encoding": "mapping",
            "key": "t_bytes32",
            "label": "mapping(bytes32 => bool)",
            "numberOfBytes": "32",
            "value": "t_bool"
        },
        "t_string_storage": {
            "encoding": "bytes",
            "label": "string",
            "numberOfBytes": "32"
        },
        "t_uint256": {
            "encoding": "inplace",
            "label": "uint256",
            "numberOfBytes": "32"
        },
        "t_uint8": {
            "encoding": "inplace",
            "label": "uint8",
            "numberOfBytes": "1"
        }
    }
}
