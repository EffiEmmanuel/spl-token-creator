import type { NextPage } from "next";
import Head from "next/head";
import { BasicsView } from "../views";

const Basics: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SPL Token Creator</title>
        <meta name="description" content="Basic Functionality" />
      </Head>
      <BasicsView />
    </div>
  );
};

export default Basics;
