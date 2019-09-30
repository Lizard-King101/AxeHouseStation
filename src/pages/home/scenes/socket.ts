export function socket() {
    this.events = {};

    this.on = (event, cb) => {
        this.events[event] = cb;
    }

    this.emit = (event, data) => {
        if(this.event[event]) {
            this.event[event](data);
        }
    }
}