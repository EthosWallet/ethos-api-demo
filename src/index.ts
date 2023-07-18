import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";
import { v4 } from "uuid";
const apiKey = process.env.API_KEY;
const baseUrl = "https://api.ethoswallet.xyz/api/v1";
const headers: any = {
  authorization: apiKey, //#### this is the api key for your tenant.  ####
  //#### This will be the same accross all call your system makes to our system. ####
  //#### This is private and shouldn't be used in a web ui or public context ####
  "content-type": "application/json",
};
const NUMBER_OF_ACCOUNTS_TO_CREATE_FOR_THIS_DEMO: number = 3;
const MIN_WEIGHT_OF_SIGNERS_REQUIRED_FOR_MULTISIG: number = 2;
const DATA_TO_MULTI_SIG = "Hello World!"; //this can be any data you want to sign.
/**
 * Create an account and wallet that can be used to sign data, whether multi-sig or not.
 * @returns
 */
async function createAccount(): Promise<any> {
  const account: any = await fetch(`${baseUrl}/accounts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "My Account", //Customer X's Account
      externalId: v4(), //#### this is the id for linking this account to your system ####
    }),
  });
  return account.json();
}
/**
 * Start the creation of a multisig wallet.  You will have to add signers and generate the wallet before you can use it.
 * @param name
 * @returns
 */
async function createMultisigWallet(name: string): Promise<string> {
  const multiSigWallet: any = await fetch(`${baseUrl}/wallets`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: name,
      minWeightOfSigners: MIN_WEIGHT_OF_SIGNERS_REQUIRED_FOR_MULTISIG,
    }),
  });
  return multiSigWallet;
}

/**
 * Add a signer to a multisig wallet.
 * @param msWalletId
 * @param account
 * @returns
 */
async function addSigners(msWalletId: string, account: any): Promise<any> {
  return await fetch(`${baseUrl}/wallets/${msWalletId}/signer`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      walletAddress: account.wallets[0].address,
      publicKey: account.wallets[0].publicKey,
      publicKeyType: "ED25519",
      signatureWeight: 1,
    }),
  });
}
/**
 * Generate a multisig wallet.  This will require that the weight of the added signers is greater
 * than then minWeightOfSigners for the wallet in order to generate it.
 * @param id
 */
async function generateWallet(id: string): Promise<void> {
  await fetch(`${baseUrl}/wallets/${id}/generate`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      minWeightOfSigners: MIN_WEIGHT_OF_SIGNERS_REQUIRED_FOR_MULTISIG,
    }),
  });
}
/**
 * Create a signature for the individual account that can be used to sign multisig data.
 * @param id
 * @param dataToSign
 * @returns
 */
async function createAccountSignature(
  id: string,
  dataToSign: any
): Promise<string> {
  const b64DataToSign = btoa(dataToSign);
  const res = await fetch(`${baseUrl}/accounts/${id}/signbase64`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      b64DataToSign: b64DataToSign,
    }),
  });
  const jsonData: any = await res.json();
  return jsonData.signature;
}
/**
 * Create a multi-sig signature process by providing data to be signed and the wallet id of an existing multi-sig wallet that
 * has been generated.
 * @param walletId
 * @param dataToSign
 * @returns
 */
async function createMultiSigProcess(
  walletId: string,
  dataToSign: string
): Promise<void> {
  const multisig: any = await fetch(`${baseUrl}/signatures`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      walletId: walletId,
      b64DataToSign: btoa(dataToSign),
    }),
  });
  console.log(multisig.statusText);
  return multisig;
}

/**
 * Provide a signature from one of the individual accounts that was added to the multi-sig wallet.
 * @param id
 * @param signature
 */
async function signMultiSig(id: string, signature: any): Promise<any> {
  const multisig: any = await fetch(`${baseUrl}/signatures/${id}/sign`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      b64Signature: signature,
    }),
  });
  console.log(multisig.statusText);
  return multisig;
}
/**
 * Get a multsig signature by id.
 * @param id
 * @returns
 */
async function getMultiSigProcess(id: string): Promise<any> {
  return await fetch(`${baseUrl}/signatures/${id}`, {
    method: "GET",
    headers,
  });
}
/**
 * Demo runner.
 */
async function main() {
  const accounts = [];
  for (let i = 0; i < NUMBER_OF_ACCOUNTS_TO_CREATE_FOR_THIS_DEMO; i++) {
    const act = await createAccount();
    accounts.push(act);
    console.log(`created account ${i} - ${act.account.id}`);
  }
  const multiSigWalletRes: any = await createMultisigWallet("My Wallet");
  console.log("created wallet");
  const multiSigWallet = await multiSigWalletRes.json();
  for (let i = 0; i < accounts.length; i++) {
    const act = accounts[i];
    const asRes = await addSigners(multiSigWallet.id, act.account);
    if (asRes.status == 200) {
      console.log(
        `added signer ${i} - ${act.account.id} to wallet ${multiSigWallet.id}`
      );
    }
  }
  await generateWallet(multiSigWallet.id);
  console.log(`generated wallet ${multiSigWallet.id}`);
  let multSigProcessRes: any = await createMultiSigProcess(
    multiSigWallet.id,
    DATA_TO_MULTI_SIG
  );
  let multSigProcess: any = await multSigProcessRes.json();
  console.log(`created multisig process ${multSigProcess.id}`);
  for (let i = 0; i < accounts.length; i++) {
    const act: any = accounts[i];
    const signature = await createAccountSignature(
      act.account.id,
      DATA_TO_MULTI_SIG
    );
    console.log(
      `created signature for account ${act.account.id} - ${signature}`
    );
    const signMultisgRes = await signMultiSig(multSigProcess.id, signature);
    console.log(`signed multisig process for account ${act.account.id}`);
    console.log(signMultisgRes.statusText);
  }
  multSigProcessRes = await getMultiSigProcess(multSigProcess.id);
  multSigProcess = await multSigProcessRes.json();
  console.log(`multisig process status: ${multSigProcess.status}`);
}
// Run the demo.
main()
  .then(() => console.log("Done"))
  .catch(console.error);
