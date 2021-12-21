import { vsprintf } from "sprintf-js";

const sprintf = (s, values) => vsprintf(s, values);

export default { sprintf };
