import type { NextPage } from "next";
import Head from "next/head";
import { UpdateView } from "../views";

const Update: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SPL Token Creator</title>
        <meta name="description" content="SPL Token Creator" />
      </Head>
      <UpdateView />
    </div>
  );
};

export default Update;
