group "default" {
  targets = [
    "bitcoin-dump",
    "bitcoin-ingest",
    "bitcoin-data-service",
    "evm-dump",
    "evm-ingest",
    "evm-data-service",
    "solana-dump",
    "solana-ingest",
    "solana-data-service",
    "substrate-dump",
    "substrate-ingest",
    "substrate-metadata-service",
    "tron-dump",
    "tron-ingest",
    "fuel-dump",
    "fuel-ingest",
    "hyperliquid-fills-data-service",
    "hyperliquid-fills-ingest",
    "hyperliquid-replica-cmds-ingest",
    "hyperliquid-replica-cmds-data-service",
  ]
}

target "_common" {
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64"]
}

target "bitcoin-dump" {
  inherits = ["_common"]
  target   = "bitcoin-dump"
}

target "bitcoin-ingest" {
  inherits = ["_common"]
  target   = "bitcoin-ingest"
}

target "bitcoin-data-service" {
  inherits = ["_common"]
  target   = "bitcoin-data-service"
}

target "evm-dump" {
  inherits = ["_common"]
  target   = "evm-dump"
}

target "evm-ingest" {
  inherits = ["_common"]
  target   = "evm-ingest"
}

target "evm-data-service" {
  inherits = ["_common"]
  target   = "evm-data-service"
}

target "solana-dump" {
  inherits = ["_common"]
  target   = "solana-dump"
}

target "solana-ingest" {
  inherits = ["_common"]
  target   = "solana-ingest"
}

target "solana-data-service" {
  inherits = ["_common"]
  target   = "solana-data-service"
}

target "substrate-dump" {
  inherits = ["_common"]
  target   = "substrate-dump"
}

target "substrate-ingest" {
  inherits = ["_common"]
  target   = "substrate-ingest"
}

target "substrate-metadata-service" {
  inherits = ["_common"]
  target   = "substrate-metadata-service"
}

target "tron-dump" {
  inherits = ["_common"]
  target   = "tron-dump"
}

target "tron-ingest" {
  inherits = ["_common"]
  target   = "tron-ingest"
}

target "fuel-dump" {
  inherits = ["_common"]
  target   = "fuel-dump"
}

target "fuel-ingest" {
  inherits = ["_common"]
  target   = "fuel-ingest"
}

target "hyperliquid-fills-data-service" {
  inherits = ["_common"]
  target   = "hyperliquid-fills-data-service"
}

target "hyperliquid-fills-ingest" {
  inherits = ["_common"]
  target   = "hyperliquid-fills-ingest"
}

target "hyperliquid-replica-cmds-ingest" {
  inherits = ["_common"]
  target   = "hyperliquid-replica-cmds-ingest"
}

target "hyperliquid-replica-cmds-data-service" {
  inherits = ["_common"]
  target   = "hyperliquid-replica-cmds-data-service"
}
