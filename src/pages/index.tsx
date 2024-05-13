import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>SPL Token Creator</title>
        <meta name="description" content="SPL Token Creator" />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
