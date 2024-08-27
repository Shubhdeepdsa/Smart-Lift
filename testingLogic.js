const readline = require('readline');

class Lift {
    constructor(id, current_floor = 0, load = 0, capacity = 25, floors_going_to = []) {
        this.id = id;
        this.current_state = 'idle'; // 'up', 'down', 'idle'
        this.floors_going_to = floors_going_to;
        this.current_floor = current_floor;
        this.load = load; // number of people in the lift
        this.at_capacity = load >= capacity; // True if the lift is at or over capacity
        this.capacity = capacity; // Maximum number of people the lift can hold
        this.distance_to_user = null; // Distance from lift's current position to the user's current floor
        this.finishing_time = null; // Estimated time to finish its current course
        this.updateDirection();
    }

    // Update the lift's capacity status
    updateCapacityStatus() {
        this.at_capacity = this.load >= this.capacity;
    }

    // Predict whether the lift will reach capacity before picking up the user
    willBeOverloaded(potential_new_users) {
        return this.load + this.floors_going_to.length*2 + potential_new_users >= this.capacity;
    }

    // Calculate the estimated finishing time of the lift's current course
    calculateFinishingTime() {
        let time = 0;
        let previous_floor = this.current_floor;

        this.floors_going_to.forEach(floor => {
            const travel_time = Math.abs(floor - previous_floor) * 1; // 1 unit per floor travel time
            const stop_time = 2; // 2 units per stop
            time += travel_time + stop_time;
            previous_floor = floor;
        });

        return time;
    }

    // Assign the lift to a user
    assignUser(user) {
        if (!this.floors_going_to.includes(user.destination_floor)) {
            this.floors_going_to.push(user.destination_floor);
            this.updateDirection();
        }
        this.load += 1; // Simulate one person entering the lift
        this.updateCapacityStatus();
    }

    // Update the lift's direction based on its destination floors
    updateDirection() {
        if (this.floors_going_to.length > 0) {
            const next_floor = this.floors_going_to[0];
            this.current_state = this.current_floor < next_floor ? 'up' : 'down';
        } else {
            this.current_state = 'idle';
        }
    }
}

class User {
    constructor(current_floor, destination_floor) {
        this.current_floor = current_floor;
        this.destination_floor = destination_floor;
    }
}

// Logic for Assigning a Lift to a User
// Logic for Assigning a Lift to a User
function allocateLift(lifts, user) {
    // Exclude lifts that are at capacity or likely to reach capacity
    const availableLifts = lifts.filter(lift => 
        !lift.at_capacity && 
        !lift.willBeOverloaded(1) // Assuming 1 user is trying to board the lift
    );

    // Calculate distance to user and finishing time for each available lift
    availableLifts.forEach(lift => {
        lift.distance_to_user = Math.abs(lift.current_floor - user.current_floor);
        lift.finishing_time = lift.calculateFinishingTime();
    });

    let chosenLift = null;

    // Check if there are lifts below the user
    const liftsBelow = availableLifts.filter(lift => lift.current_floor < user.current_floor);
    
    if (liftsBelow.length > 0) {
        if (user.current_floor < user.destination_floor) {
            // User is going up
            // Case 1: Lift Going to the Same Floor
            const liftsGoingToDestination = liftsBelow.filter(lift => lift.floors_going_to.includes(user.destination_floor));
            
            if (liftsGoingToDestination.length > 0) {
                chosenLift = liftsGoingToDestination[0]; // Assign the first match
            } else {
                // Case 2: No lifts going to the destination floor; fallback to closest lift logic
                chosenLift = liftsBelow.reduce((closest, lift) => lift.distance_to_user < closest.distance_to_user ? lift : closest);
            }
        } else {
            // User is going down
            // Use closest lift logic regardless of whether the lift is going to the destination floor
            chosenLift = liftsBelow.reduce((closest, lift) => lift.distance_to_user < closest.distance_to_user ? lift : closest);
        }
    } else {
        // No lifts below the user
        const liftsAtUserFloor = availableLifts.filter(lift => Math.min(...lift.floors_going_to) === user.current_floor);
        
        if (liftsAtUserFloor.length > 0) {
            chosenLift = liftsAtUserFloor[0]; // Assign the first match
        } else {
            const liftsComingTowardsUser = availableLifts.filter(lift => 
                (lift.current_floor > user.current_floor && lift.current_state === 'down') ||
                (lift.current_floor < user.current_floor && lift.current_state === 'up')
            );
            
            if (liftsComingTowardsUser.length > 0) {
                chosenLift = liftsComingTowardsUser.reduce((closest, lift) => lift.distance_to_user < closest.distance_to_user ? lift : closest);
            } else {
                // Case 3: Closest Lift to Finish Its Course
                chosenLift = availableLifts.reduce((closest, lift) => lift.finishing_time < closest.finishing_time ? lift : closest);
            }
        }
    }

    // Assign the lift to the user
    if (chosenLift) {
        chosenLift.assignUser(user);
    }

    return chosenLift;
}


// Rebalancing Idle Lifts
function rebalanceIdleLifts(lifts, floors) {
    const idleLifts = lifts.filter(lift => lift.current_state === 'idle');
    const strategicFloors = [Math.min(...floors), Math.floor(floors.length / 2), Math.max(...floors)];

    idleLifts.forEach((lift, index) => {
        const targetFloor = strategicFloors[index % strategicFloors.length];
        lift.floors_going_to.push(targetFloor);
        lift.updateDirection();
    });
}

// Setting up Readline Interface for User Input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const lifts = [];
const assignments = [];

function initializeLifts() {
    rl.question('Enter the number of lifts: ', (numLifts) => {
        let count = 0;

        function setupLift() {
            if (count < numLifts) {
                rl.question(`Enter the current floor, load, and floors going to (comma separated) for Lift ${count + 1}: `, (input) => {
                    const [current_floor, load, ...floors_going_to] = input.split(',').map(Number);
                    const lift = new Lift(count + 1, current_floor, load, 25, floors_going_to);
                    lifts.push(lift);
                    count++;
                    setupLift();
                });
            } else {
                promptUser();
            }
        }

        setupLift();
    });
}

function promptUser() {
    rl.question('Enter user current floor and destination floor (comma separated) or type "exit" to quit: ', (input) => {
        if (input.toLowerCase() === 'exit') {
            rl.close();
            displayAssignments();
        } else {
            const [current_floor, destination_floor] = input.split(',').map(Number);
            const user = new User(current_floor, destination_floor);
            const assignedLift = allocateLift(lifts, user);
            assignments.push({ user, assignedLift });
            promptUser();
        }
    });
}

function displayAssignments() {
    console.log('\nLift Assignments:');
    console.table(assignments.map((assignment, index) => ({
        'User': `User ${index + 1}`,
        'Current Floor': assignment.user.current_floor,
        'Destination Floor': assignment.user.destination_floor,
        'Assigned Lift': assignment.assignedLift ? `Lift ${assignment.assignedLift.id}` : 'None'
    })));

    console.log('\nLift Status:');
    console.table(lifts.map(lift => ({
        'Lift ID': lift.id,
        'Current Floor': lift.current_floor,
        'Load': lift.load,
        'Direction': lift.current_state,
        'Floors Going To': lift.floors_going_to.join(', '),
        'At Capacity': lift.at_capacity ? 'Yes' : 'No'
    })));
}

// Start the lift setup process
initializeLifts();
