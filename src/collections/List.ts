
export default class List<T> implements IIterable<T> {

    private values: T[];

    constructor() {
        this.values = [];
    }

    public Add(value: T) {
        this.values.push(value);
    }

    public GetAt(index: number): T | undefined {
        return this.values[index];
    }

    public Clear() {
        this.values = [];
    }

    public Find(value: T): T | undefined {
        return this.values.find((item: T) => item == value);
    }

    public IndexOf(value: T): number {
        var index = -1
        this.values.find((item: T, i: number) => {
            if(item == value) {
                index = i
                return true
            }
            return false
        })
        return index
    }

    public Remove(value: T): boolean {
        const index = this.IndexOf(value) 
        if(index != -1) {
            this.RemoveAt(index)
            return true
        }
        return false
    }

    public RemoveAt(index: number): boolean {
        if (index < this.values.length) {
            this.values.splice(index, 1);
            return true;
        }

        return false;
    }

    public ForEach(callback: (item: T) => void): void {
        this.values.forEach((item: T) => callback(item))
    }

    public Count() {
        return this.values.length;
    }

    GetIterator(): IIterator<T> {
        return new Iterator(this.values);
    }
}

interface IIterator<T> {
    Reset: () => void
    CurrentElement(): T | undefined
    NextElement(): boolean
}

interface IIterable<T> {
    GetIterator(): IIterator<T>;
}

class Iterator<T> implements IIterator<T> {
    private index: number = -1;
    private source: T[];

    constructor(source: T[]) {
        this.source = source;
        this.Reset();
    }

    Reset(): void {
        this.index = -1;
    }

    NextElement(): boolean {
        if (this.index + 1 < this.source.length) {
            this.index++;
            return true;
        }

        return false;
    }

    CurrentElement(): T | undefined {
        return this.source[this.index];
    }
}
