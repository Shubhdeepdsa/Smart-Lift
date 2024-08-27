### Data Structure

#### Lift

```javascript
lift = {
    current_state: 'idle', // 'up', 'down', 'idle'
    floors_going_to: [1, 5, 7], 
    load: 3, // number of people in the lift
    at_capacity: false, // Assuming the max capacity to be 25
    capacity: 25, // Maximum number of people the lift can hold
    distance_to_user: null, // Distance from lift's current position to the user's current floor
    finishing_time: null // Estimated time to finish its current course
}
```

#### User

```javascript
user = {
    current_floor: 3,
    destination_floor: 8
}
```

### Logic

This logic will be executed in chronological order to assign the best lift to the user.

1. **Exclude Overloaded Lifts**:
   - Any lift which is at capacity (`at_capacity: true`) will not be considered in the algorithm.

2. **Predictive Handling of Potential Overloading**:
   - If a lift is likely to reach capacity before picking up the user (based on its current load and the number of stops it will make before reaching the user), exclude it from the algorithm.
   - **Logic** - Count how many people have selected the floor and add a buffer number like 2 to it to count for people who get on directly without using the system and add it to ```load``` and then subtract it from the ```capacity``` and if is a positive number that means that it can carry the user. so we can move ahead with this lift otherwise we can exclude it.

3. **Check if There Are Lifts Below the User**:
   - **If there are multiple lifts below the user**:

     - **Case 1: Lift Going to the Same Floor (only use this if the user is going up)**:
       - Check if any lift is already going to the floor the user wants to go to (`destination_floor`). If so, assign that lift to the user.
     - **Case 2: Closest Lift**:
       - If no lift is already going to the user's destination floor, assign the closest lift to the user’s current floor.

4. **If No Lifts Below the User**:
   - **Case 1: Lift at User's Floor**:
     - Check all lifts for the lowest number in their `floors_going_to` array. If a lift’s lowest destination matches the user’s current floor, assign that lift to the user.
   - **Case 2: Lift Coming Towards the User**:
     - Assign the closest lift that is moving towards the user. A lift is considered to be moving towards the user if it is currently above the user and moving down, or below the user and moving up.
   - **Case 3: Closest Lift to Finish Its Course**:
     - If no lift is coming towards the user or at the user’s floor, assign the lift that is closest to finishing its current course.
     - If multiple lifts are expected to finish around the same time, assign the one closest to the user.
     - We can calculate the course with variables like we can assume that it takes 1 unit to travel between floor without stopping and 2 units if the lift needs to make a stop and accordingly we can calculate the time and the lowest one we can assign.
5. **Rebalancing Idle Lifts**:
   - Idle lifts are place in alternate places like one in ground floor and one in middle and then on top floor and repeat for more lifts.


### Summary

1. **Excludes Overloaded Lifts**: Any lift that is at capacity or predicted to reach capacity before picking up the user is excluded from consideration.

2. **Optimizes Lift Assignment**:
   - Prioritizes lifts that are already going to the user's destination floor.
   - Considers lifts below the user first, then looks at lifts moving towards the user.
   - Assigns the lift closest to finishing its current course if no immediate match is found.

3. **Re balance Idle Lifts**: Idle lifts are place in alternate places like one in ground floor and one in middle and then on top floor and repeat for more lifts.

