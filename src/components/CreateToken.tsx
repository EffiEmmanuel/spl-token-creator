import { ChangeEvent, FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { FaLink, FaXmark } from "react-icons/fa6";
import { notify } from "utils/notifications";

export const CreateToken: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [metadata, setMetadata] = useState("");
  const [amount, setAmount] = useState("");
  const [decimals, setDecimals] = useState("");
  const [image, setImage] = useState<File | null>();
  const [description, setDescription] = useState<string>("");

  // Handle image
  const [renderImage, setRenderImage] = useState<string | null>("");
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImage(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setRenderImage(reader.result as string);
    };

    if (file) {
      console.log("IMAGE:", file);
      reader.readAsDataURL(file);
    }
  };

  async function uploadFile(
    file: File,
    resourceType: string,
    uploadPreset: string
  ) {
    // UPLOAD IMAGE TO CLOUDINARY FIRST
    const formData = new FormData();
    formData.append("file", file);
    if (uploadPreset === "token-json")
      formData.append("public_id", `${tokenName}-${Date.now()}-${symbol}.json`);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/gethsemane-tech/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    return response;
  }

  const handleCreateToken = useCallback(async () => {
    if (!image) {
      console.log("IMAGE:", image);
      alert("You must select an image");
      return;
    }
    const uploadImageResponse = await uploadFile(
      image,
      "image",
      "token-creator"
    );
    const uploadImageData = await uploadImageResponse.json();
    console.log("UPLOAD IMAGE DATA FROM CLOUDINARY:", uploadImageData);
    if (!uploadImageData?.secure_url) {
      alert("An error occured while uploading your image. Please try again.");
      return;
    }
    // Create json file for metadata
    const metadataJSON = JSON.stringify({
      name: tokenName,
      symbol,
      description,
      image: uploadImageData?.secure_url,
    });

    // Step 2: Convert JSON data to a Blob
    const blob = new Blob([metadataJSON], { type: "application/json" });
    console.log("OVER HERE 1");

    // Step 3: Create a File object from the Blob
    const file = new File([blob], `${tokenName}-${Date.now()}-${symbol}.json`, {
      type: "application/json",
    });

    console.log("OVER HERE 2");

    // Upload it to cloudinary
    const uploadMetadataResponse = await uploadFile(file, "raw", "token-json");
    console.log("OVER HERE 3");

    const uploadMetadataData = await uploadMetadataResponse.json();
    console.log("OVER HERE 4:", uploadMetadataData?.secure_url);

    if (!uploadMetadataData?.secure_url) {
      alert(
        "An error occured while uploading your token's metadata. Please try again."
      );
      return;
    }

    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const mintKeypair = Keypair.generate();
    const tokenATA = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      publicKey
    );

    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            PROGRAM_ID.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          PROGRAM_ID
        )[0],
        mint: mintKeypair.publicKey,
        mintAuthority: publicKey,
        payer: publicKey,
        updateAuthority: publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: tokenName,
            symbol: symbol,
            uri: uploadMetadataData?.secure_url,
            creators: null,
            sellerFeeBasisPoints: 0,
            uses: null,
            collection: null,
          },
          isMutable: false,
          collectionDetails: null,
        },
      }
    );

    const createNewTokenTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        +decimals,
        publicKey,
        publicKey,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        publicKey,
        tokenATA,
        publicKey,
        mintKeypair.publicKey
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        tokenATA,
        publicKey,
        +amount * Math.pow(10, +decimals)
      ),
      createMetadataInstruction
    );
    await sendTransaction(createNewTokenTransaction, connection, {
      signers: [mintKeypair],
    }).then((res) => {
      console.log("RESPONSE:", res);
      notify({
        type: "success",
        message: "Your token has been created successfully!",
        description: "Check your wallet to access your token",
        txid: res,
      });
    });
  }, [publicKey, connection, sendTransaction]);

  return (
    <>
      <div className="min-h-screen bg-[#121212] text-white text-left">
        {/* Create Token */}
        <div className="bg-darkPurple w-full p-10 rounded-lg mt-7">
          <h2 className="text-lg font-semibold">Create Spl Token</h2>

          <div className="bg-lightPurple rounded-lg p-5 mt-5 flex lg:flex-row flex-col lg:gap-x-10 relative">
            <div className="flex flex-row w-full lg:w-[50%]">
              <div className="hidden lg:flex flex-col">
                <div className="border-[3px] border-lightGray rounded-full h-10 w-10 p-2">
                  <div className="h-5 w-5 bg-lightGray rounded-full"></div>
                </div>
              </div>

              <div className="py-1 lg:px-3">
                <h3 className="uppercase text-lg text-lightGray font-semibold">
                  Token Information
                </h3>
                <p className="text-sm">
                  This information is stored on IPFS by + Metaplex Metadata
                  standard.
                </p>

                {/* Form */}
                <div className="mt-5">
                  <form className="flex flex-col gap-y-5">
                    <div className="flex flex-col gap-y-1">
                      <label
                        htmlFor="tokenName"
                        className="text-sm text-lightGray"
                      >
                        Token Name (ex. Dexlab)
                      </label>

                      <input
                        type="text"
                        name="tokenName"
                        id="tokenName"
                        className="p-2 px-4 rounded-lg h-10 w-full focus:border-none outline-none focus:outline-none bg-darkPurple placeholder:text-gray-500"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        placeholder="Enter token name"
                      />
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <label
                        htmlFor="symbol"
                        className="text-sm text-lightGray"
                      >
                        Symbol (Max 10, ex. DXL)
                      </label>

                      <input
                        type="text"
                        name="symbol"
                        id="symbol"
                        className="p-2 px-4 rounded-lg h-10 w-full focus:border-none outline-none focus:outline-none bg-darkPurple placeholder:text-gray-500"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        placeholder="Enter token symbol"
                      />
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <label
                        htmlFor="description"
                        className="text-sm text-lightGray"
                      >
                        (Optional) Description
                      </label>

                      <textarea
                        name="description"
                        id="description"
                        className="p-2 px-4 rounded-lg h-10 w-full focus:border-none outline-none focus:outline-none bg-darkPurple placeholder:text-gray-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter project description"
                      ></textarea>
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <label
                        htmlFor="amount"
                        className="text-sm text-lightGray"
                      >
                        Amount
                      </label>

                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        className="p-2 px-4 rounded-lg h-10 w-full focus:border-none outline-none focus:outline-none bg-darkPurple placeholder:text-gray-500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <label
                        htmlFor="decimals"
                        className="text-sm text-lightGray"
                      >
                        Decimals
                      </label>

                      <input
                        type="number"
                        name="decimals"
                        id="decimals"
                        className="p-2 px-4 rounded-lg h-10 w-full focus:border-none outline-none focus:outline-none bg-darkPurple placeholder:text-gray-500"
                        value={decimals}
                        onChange={(e) => setDecimals(e.target.value)}
                        placeholder="Enter decimals"
                      />
                    </div>

                    <div className="flex flex-col gap-y-1">
                      <label
                        htmlFor="description"
                        className="text-sm text-lightGray"
                      >
                        Symbol Image (ex. Square size 128x128 or larger is
                        recommended.)
                      </label>

                      <div className="mt-2 w-full relative border-dashed border-[1px] border-gray-300 rounded-lg h-24 flex flex-col items-center justify-center overflow-hidden">
                        <>
                          <MdOutlineAddAPhoto
                            size={24}
                            className="text-gray-300"
                          />
                          <small className="text-gray-300 text-center">
                            Click to Insert Profile Picture
                          </small>
                          <input
                            className="absolute top-0 bg-transparent w-full h-full opacity-0 cursor-pointer"
                            type="file"
                            name="image"
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </>

                        {renderImage && image && (
                          <div className="absolute w-full h-full top-0 flex justify-center items-center">
                            <div className="flex flex-row items-center justify-center h-10 w-10 rounded-full bg-lightPurple p-2 absolute top-3 right-3 cursor-pointer z-40">
                              <FaXmark
                                onClick={() => {
                                  setImage(null);
                                  setRenderImage("");
                                }}
                                size={16}
                                className="text-lightGray"
                              />
                            </div>
                            <img
                              src={renderImage}
                              alt="Uploaded"
                              className="object-cover h-full w-full z-10"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {publicKey ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleCreateToken();
                        }}
                        className="rounded-full h-14 w-full bg-[#43437D]"
                      >
                        Create Token
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          alert(
                            "Use the connect wallet button at the top of the page to connect your wallet"
                          );
                        }}
                        disabled={publicKey ? true : false}
                        className="rounded-full h-14 w-full bg-[#43437D]"
                      >
                        <>{publicKey ? "Wallet Connected" : "Connect Wallet"}</>
                      </button>
                    )}
                  </form>

                  <div className="text-gray-500 my-5">
                    <p>CREATE TOKEN</p>
                    <p>
                      Generate a token. In this process, you can get a token
                      mint address.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Line */}
            <div className="hidden lg:block -ml-px absolute mt-0.5 top-14 left-10 w-0.5 h-[79.5%] bg-gray-300"></div>
            <div className="hidden lg:flex flex-col absolute -ml-px bottom-12 left-5">
              <div className="border-[3px] border-lightGray rounded-full h-10 w-10 p-2">
                <div className="h-5 w-5 bg-lightGray rounded-full"></div>
              </div>
            </div>

            <div className="w-full lg:w-[50%]">
              <div className="py-1">
                <h3 className="uppercase text-lg text-lightGray font-semibold">
                  Preview
                </h3>
              </div>
              <div className="bg-darkPurple rounded-lg p-2 mt-2 h-max">
                <div className="bg-lightPurple rounded-lg p-4">
                  <div className="flex flex-row items-center gap-x-2">
                    <div className="overflow-hidden h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                      {!renderImage && (
                        <h1 className="text-2xl font-bold uppercase">
                          {symbol ? symbol?.split("")[0] : "S"}
                        </h1>
                      )}
                      {renderImage && (
                        <img
                          src={renderImage}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <p className="text-blue-600">
                        {!tokenName ? " Token Name" : tokenName}
                      </p>
                      <p className="text-lightGray">
                        {!symbol ? " Symbol" : symbol}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-darkPurple mt-4 rounded-lg p-6">
                <h3 className="text-lg text-lightGray">Token Information</h3>

                <div className="flex flex-col gap-y-10 mt-5">
                  <div className="flex flex-col gap-y-1 lg:flex-row gap-x-2">
                    <span>Name:</span>
                    <span>{tokenName}</span>
                  </div>
                  <div className="flex flex-col gap-y-1 lg:flex-row gap-x-2">
                    <span>Symbol:</span>
                    <span>{symbol}</span>
                  </div>
                  <div className="flex flex-col gap-y-1 lg:flex-row gap-x-2">
                    <span>Program:</span>
                    <a
                      className="text-blue-600 flex flex-row gap-x-1 items-center"
                      target="_blank"
                      rel="noreferrer"
                      href="https://solscan.io/address/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                    >
                      <span>Token Program</span>
                      <FaLink size={14} />
                    </a>
                  </div>

                  <div className="flex flex-col gap-y-1 lg:flex-row gap-x-2 max-w-full">
                    <span className="w-full">Mint Authority:</span>
                    <span className="text-wrap truncate text-ellipsis ...">
                      {publicKey ? publicKey?.toBase58() : ""}
                    </span>
                  </div>

                  <div className="flex flex-col gap-y-1 lg:flex-row gap-x-2 max-w-full">
                    <span className="">Update Authority:</span>
                    <span className="text-wrap truncate text-ellipsis ...">
                      {publicKey ? publicKey?.toBase58() : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
