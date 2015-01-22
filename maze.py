#this is our random maze generator
#2D array in Python with tuple coordinate pairs as keys
#value for each key is:
# 0 = empty space
# 1 = wall

test = "hello"

#maze object (dictionary)
def maze(n):
    maze_keys = []
    for y in range(n):
        maze_keys = maze_keys + [(x,y) for x in range(n)]

    #show maze as a list of tuples (coordinates)
    def show_maze():
        for key in maze_keys:
            print str(key)
        print "######################"

    #initialize all maze tiles as walls
    maze_coordinates = {}
    for key in maze_keys:
        maze_coordinates[key] = 1

    #return the maze as a dictionary
    return maze_coordinates
