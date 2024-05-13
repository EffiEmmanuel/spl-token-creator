import type { NextPage } from "next";
import Head from "next/head";
import { MetadataView } from "../views";

const Metadata: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SPL Token Creator</title>
        <meta name="description" content="SPL Token Creator" />
      </Head>
      <MetadataView />
    </div>
  );
};

export default Metadata;
