
import { DFSortedList } from "./DFSortedList.js"

export class DFTimeList extends DFSortedList {
    add(val, tym = 0) {  // add value and return key
        if (!tym) {
            tym = Date.now();
        }
        let idx = this.keys.length - 1;
        while (idx >= 0) {
            if (tym > this.keys[idx]) { // key is unique
                break;
            }
            if (tym === this.keys[idx]) {
                ++tym;
                ++idx;      // since we incremented time we need to ++idx too to check next one again
                if (idx >= this.keys.length) {  // don't check past eolist
                    break;
                }
                continue;
            }
            --idx;
        }
        super.add(tym, val);
        return tym;
    }
}