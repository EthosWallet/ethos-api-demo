# Ethos API Demo
The purpose of this repo is to provide a simple demo for using the Ethos Public API, the Swagger docs for which are located [here](https://api-docs.ethoswallet.xyz).

# What does it do?
1. Creates wallets that can be used for signing arbitrary data
1. Creates a multi-sig wallet
1. Adds the individual wallets as signers of the multi-sig wallet
1. Generates the multi-sig wallet
1. Starts a multi-sig signature process to sign arbitrary data
1. Uses the inidividual accounts to sign the arbitrary data
1. Retrieves the signature.

# Running the demo
1. Contact support@ethoswallet.xyz to get a tenant id and api key.
2. Create a .env file in the root of this directory and put the following in it:

   ``` API_KEY=<api key provided by ethose> ```

3. Install dependencies

   ``` npm install ```

4. Run the project

   ``` npm start ```