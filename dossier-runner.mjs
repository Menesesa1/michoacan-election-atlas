import { jsPDF as RealJsPDF } from "jspdf";
import { writeFileSync } from "node:fs";

class WrappedJsPDF extends RealJsPDF {
  constructor(...a) {
    super(...a);
    this.save = (f) => {
      writeFileSync("/tmp/" + f, Buffer.from(this.output("arraybuffer")));
      console.log("SAVED", f);
      return this;
    };
  }
}
globalThis.__WrappedJsPDF = WrappedJsPDF;
