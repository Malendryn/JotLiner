
import { DFSortedList } from "./DFSortedList.js"

export class DFTimeList extends DFSortedList {
    lastTime = 0;
    add(val) {  // add value and return key
        let now = Date.now();
        if (now == this.lastTime) {
            now = ++this.lastTime;
        }
        super.add(now, val);
        return now;
    }
}