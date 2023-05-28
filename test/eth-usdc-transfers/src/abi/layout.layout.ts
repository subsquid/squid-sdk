export const LAYOUT_JSON = {
    "storage": [
        {
            "label": "_owner",
            "offset": 0,
            "slot": "0",
            "type": "t_address"
        },
        {
            "label": "pauser",
            "offset": 0,
            "slot": "1",
            "type": "t_address"
        },
        {
            "label": "paused",
            "offset": 20,
            "slot": "1",
            "type": "t_bool"
        },
        {
            "label": "blacklister",
            "offset": 0,
            "slot": "2",
            "type": "t_address"
        },
        {
            "label": "blacklisted",
            "offset": 0,
            "slot": "3",
            "type": "t_mapping(t_address,t_bool)"
        },
        {
            "label": "name",
            "offset": 0,
            "slot": "4",
            "type": "t_string_storage"
        },
        {
            "label": "symbol",
            "offset": 0,
            "slot": "5",
            "type": "t_string_storage"
        },
        {
            "label": "decimals",
            "offset": 0,
            "slot": "6",
            "type": "t_uint8"
        },
        {
            "label": "currency",
            "offset": 0,
            "slot": "7",
            "type": "t_string_storage"
        },
        {
            "label": "masterMinter",
            "offset": 0,
            "slot": "8",
            "type": "t_address"
        },
        {
            "label": "initialized",
            "offset": 20,
            "slot": "8",
            "type": "t_bool"
        },
        {
            "label": "balances",
            "offset": 0,
            "slot": "9",
            "type": "t_mapping(t_address,t_uint256)"
        },
        {
            "label": "allowed",
            "offset": 0,
            "slot": "10",
            "type": "t_mapping(t_address,t_mapping(t_address,t_uint256))"
        },
        {
            "label": "totalSupply_",
            "offset": 0,
            "slot": "11",
            "type": "t_uint256"
        },
        {
            "label": "minters",
            "offset": 0,
            "slot": "12",
            "type": "t_mapping(t_address,t_bool)"
        },
        {
            "label": "minterAllowed",
            "offset": 0,
            "slot": "13",
            "type": "t_mapping(t_address,t_uint256)"
        },
        {
            "label": "_rescuer",
            "offset": 0,
            "slot": "14",
            "type": "t_address"
        },
        {
            "label": "DOMAIN_SEPARATOR",
            "offset": 0,
            "slot": "15",
            "type": "t_bytes32"
        },
        {
            "label": "_authorizationStates",
            "offset": 0,
            "slot": "16",
            "type": "t_mapping(t_address,t_mapping(t_bytes32,t_bool))"
        },
        {
            "label": "_permitNonces",
            "offset": 0,
            "slot": "17",
            "type": "t_mapping(t_address,t_uint256)"
        },
        {
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
            "label": "mapping(address => bool)",
            "numberOfBytes": "32",
            "key": "t_address",
            "value": "t_bool"
        },
        "t_mapping(t_address,t_mapping(t_address,t_uint256))": {
            "encoding": "mapping",
            "label": "mapping(address => mapping(address => uint256))",
            "numberOfBytes": "32",
            "key": "t_address",
            "value": "t_mapping(t_address,t_uint256)"
        },
        "t_mapping(t_address,t_mapping(t_bytes32,t_bool))": {
            "encoding": "mapping",
            "label": "mapping(address => mapping(bytes32 => bool))",
            "numberOfBytes": "32",
            "key": "t_address",
            "value": "t_mapping(t_bytes32,t_bool)"
        },
        "t_mapping(t_address,t_uint256)": {
            "encoding": "mapping",
            "label": "mapping(address => uint256)",
            "numberOfBytes": "32",
            "key": "t_address",
            "value": "t_uint256"
        },
        "t_mapping(t_bytes32,t_bool)": {
            "encoding": "mapping",
            "label": "mapping(bytes32 => bool)",
            "numberOfBytes": "32",
            "key": "t_bytes32",
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
