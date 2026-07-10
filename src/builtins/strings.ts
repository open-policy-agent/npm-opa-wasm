import { vsprintf } from "sprintf-js";

const sprintf = (s: string, values: string[]) => vsprintf(s, values);

export default { sprintf };
