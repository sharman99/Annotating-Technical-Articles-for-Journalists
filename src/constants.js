import React from "react";
import Loader from "react-loader-spinner";

export const LOADING_TEXT = "Loading...";

export const SPINNER = (
  <Loader
    type="Bars"
    color="#FE6847"
    height={30}
    width={200}
  />
);

export const ERROR_TEXT = "Something went wrong, sorry.";
