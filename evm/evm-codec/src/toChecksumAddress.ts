import keccak from 'keccak256'
/// 
export function toChecksumAddress(address: string) {
  address = address.toLowerCase().slice(2)
  const hash = keccak(address).toString('hex')
  let ret = '0x'

  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }
  return ret
}
