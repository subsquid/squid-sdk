import { Interface } from "@ethersproject/abi";
import ethers from "ethers";
import { EvmLogHandlerContext } from "@subsquid/substrate-evm-processor";
import inputJson from "/home/ozgur/squid/test/moonsama-erc721/src/erc721.json";

const abi = new Interface(inputJson);

export interface Approval0Event {
  	owner: string;
  	approved: string;
  	tokenId: ethers.BigNumber;
}

export interface ApprovalForAll0Event {
  	owner: string;
  	operator: string;
  	approved: boolean;
}

export interface Transfer0Event {
  	from: string;
  	to: string;
  	tokenId: ethers.BigNumber;
}

export const events = {
  "Approval(address,address,uint256)":  {
    topic: abi.getEventTopic("Approval(address,address,uint256)"),
    decode(data: EvmLogHandlerContext): Approval0Event {
      const result = abi.decodeEventLog(
      	abi.getEvent("Approval(address,address,uint256)"),
      	data.data || "",
      	data.topics
      );
      return  {
        owner: result[0],
        approved: result[1],
        tokenId: result[2],
      }
    }
  }
  ,
  "ApprovalForAll(address,address,bool)":  {
    topic: abi.getEventTopic("ApprovalForAll(address,address,bool)"),
    decode(data: EvmLogHandlerContext): ApprovalForAll0Event {
      const result = abi.decodeEventLog(
      	abi.getEvent("ApprovalForAll(address,address,bool)"),
      	data.data || "",
      	data.topics
      );
      return  {
        owner: result[0],
        operator: result[1],
        approved: result[2],
      }
    }
  }
  ,
  "Transfer(address,address,uint256)":  {
    topic: abi.getEventTopic("Transfer(address,address,uint256)"),
    decode(data: EvmLogHandlerContext): Transfer0Event {
      const result = abi.decodeEventLog(
      	abi.getEvent("Transfer(address,address,uint256)"),
      	data.data || "",
      	data.topics
      );
      return  {
        from: result[0],
        to: result[1],
        tokenId: result[2],
      }
    }
  }
  ,
}
