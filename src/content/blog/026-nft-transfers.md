---
title: NFT Transfers
author: Robert
pubDate: 2023-01-25
number: '26'
draft: false
tags:
- Feature
description: description
---
### réalisation
<iframe width="560" height="315" src="https://www.youtube.com/embed/4XjwQQCtWnU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### raison d'être
Hey yall. This week's postable project is a handy dandy transfer function that we need to move NFTs and tokens between wallets. Yep, pretty fundamental. Also, this would have taken me an hour to write in javascript (or typescript) with thirdweb's sdk, but ended up taking me 2 days in swift. Ah, the joys of poor documentation. But hey, if yall ever need to do something similar, this writeup should make it mighty easy.

### le processus
A core feature of our browser that we want to implement is the ability to quickly and easily move tokens between your wallets. We should handle the signatures, wallet addresses, and underlying ERC-based functions, leaving the user with a drag-and-drop plus a simple confirmation button. Check out @pavan's weekly posting here to see what this might look like.

Great idea right? Now let's handle the actual transfer. First things first, let's init our ethereumAccount. Because we'll be transferring real (testnet) NFTs, we need to import an account that already has an NFT we can transfer later. This requires importing an account with a private key, which can be a security risk. Thankfully, I already build a version of web3.swift that stores private keys in Apple's keychain rather than directly on disk. Check that out [here](https://experiments.gg/experiments/11). With our secure web3.swift package setup for our project, we can import our ethereumAccount like so:

```
let account = try? EthereumAccount.importAccount(addingTo: keyStorage, privateKey: "YOUR_PRIVATE_KEY_HERE", keystorePassword: "MY_PASSWORD")
```

Now we have securely imported our account! Open the "Keychain Access" app on your mac to check out how the data is being saved. It's pretty nifty! We need four things to initiate a transfer for an ERC 721 token (most common NFT): the contract address, the wallet address to transfer the NFT to, the wallet address that owns the NFT, and the tokenID. We'll also need to handle both the gasPrice and the gasLimit for the transaction, but I'll cover that later. Here's what that looks like as an ABI function:

```
    struct transferFrom: ABIFunction {
        public static let name = "transferFrom"
        public let gasPrice: BigUInt?
        public let gasLimit: BigUInt?
        public var contract: EthereumAddress
        public let from: EthereumAddress?

        public let sender: EthereumAddress
        public let to: EthereumAddress
        public let tokenId: BigUInt

```

Sweet, we've set up our variables. We'll populate them with data when we initialize the contract. Note that the 'from' and the 'sender' are both required values but will be initialized to the same address. Next, we can do the fun bit, initializing the contract! Here's what that looks like:


```
    public init(contract: EthereumAddress,
                from: EthereumAddress? = nil,
                gasPrice: BigUInt? = 9000000000,
                gasLimit: BigUInt? = 210000,
                sender: EthereumAddress,
                to: EthereumAddress,
                tokenId: BigUInt ){
        self.contract = contract
        self.from = from
        self.gasPrice = gasPrice
        self.gasLimit = gasLimit
        self.sender = sender
        self.to = to
        self.tokenId = tokenId
    }

```

Couple of things to note with this one. We're setting the gas values to a default value, but these will be changed later once we get our gas estimate. We're also linking our contract up to the values we set up in the ABIFunction we set up earlier. Lastly, before we send our raw transaction out, we need to encode it into a format that the chain can understand. That can be done simply with:

```
    public func encode(to encoder: ABIFunctionEncoder) throws {
        try encoder.encode(sender)
        try encoder.encode(to)
        try encoder.encode(tokenId)
    }

```

Great! We're encoded and ready to go. Let's set up the transferFrom function with our actual values:

```
    let function = transferFrom(contract: "0xFf7a632dEbA3df62B74661ee203C001e97caaaEb", sender: "0xF88a51B3adBAa3Ab384D3D8650C476E7cd9FD7F6", to: "0x99C274aeC0578654D56Fa4f86A1Ce25c7767f3Df", tokenId: 0)
```

The above function is pretty self-explanatory, but just make sure that the sender address is the wallet address for the account that you imported at the beginning! Otherwise, the transaction will fail after being processed on chain. Also, ensure that your tokenId is set properly! Most will be non-zero. Last but not least, we need to set up the transaction and submit it to the chain, using our private key to sign the transaction.

```
    let transaction: EthereumTransaction = try! function.transaction()

    if let unAccount = account{
        client.eth_sendRawTransaction(transaction, withAccount: unAccount) { (txHash) in
            print("TX Hash: \(txHash)")
        }
    }

```

If everything goes correctly, the console will spit out a transaction hash that looks like this: "TX Hash: success("0xc64b7af4b90cfa782601cbd403b66a8343041f8932b7f42c5473116814d1aac5")". Check out the transaction on Polyscan, and if it goes through, your NFT has been transferred!


### fin
Ok friends, we just transferred an NFT out of one wallet and into another. Not super exciting on its own, but this will code will be the backbone of dub's internal token transfer functionality. As always, and til next time, have a great day.
