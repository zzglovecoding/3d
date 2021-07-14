const nodes = [
    {
        id: 1,
        width: 100,
        height: 100,
        x: 100,
        y: 200,
        data: null
    },
    {
        id: 2,
        width: 50,
        height: 50,
        x: 400,
        y: 100,
        data: null
    },
    {
        id: 3,
        width: 80,
        height: 100,
        x: 500,
        y: 300,
        data: null
    }
];

const links = [
    {
        from: 1,
        fromdire: 'right-1',
        to: 2,
        todire: 'left-1',
        type: 1,
        style: {
            stroke: '#FFCC00'
        }
    },
    {
        from: 1,
        fromdire: 'right-3',
        to: 2,
        todire: 'left-3',
        type: 1,
        style: {
            stroke: '#00BB00'
        }
    },
    {
        from: 1,
        fromdire: 'right-2',
        to: 2,
        todire: 'left-2',
        type: 1,
        style: {
            stroke: '#FF6EBE'
        }
    }
];

export { nodes, links };
