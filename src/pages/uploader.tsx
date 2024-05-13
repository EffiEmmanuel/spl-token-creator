import type { NextPage } from "next";
import Head from "next/head";
import { UploaderView } from "../views";

const Uploader: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SPL Token Creator</title>
        <meta name="description" content="SPL Token Creator" />
      </Head>
      <UploaderView />
    </div>
  );
};

export default Uploader;
