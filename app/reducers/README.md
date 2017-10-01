It's important that the reducer stays pure. Things you should *never* do inside a reducer:
* Mutate it's arguments
* Perform side effects like API calls
* Call non-pure functions, e.g. Date.now() or Math.random()
