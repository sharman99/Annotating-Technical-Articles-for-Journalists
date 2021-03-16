import React from "react";
import Loader from "react-loader-spinner";

export const LOADING_TEXT = "Loading...";

export const SPINNER = (
  <React.Fragment>
    <Loader
      type="Bars"
      color="#FE6847"
      height={30}
      width={200}
    />
    <div className="please-wait">
      <span className="italic">Summarizing can be hard </span>😅.
      <span className="italic"> Please hold on.</span>
    </div>
  </React.Fragment>
);

export const ERROR_TEXT = "Something went wrong, sorry.";
