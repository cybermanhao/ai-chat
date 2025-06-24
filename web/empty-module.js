// mock for node:stream/PassThrough in browser
export const PassThrough = function () {
  throw new Error("PassThrough is not available in the browser.");
};
export default {};
