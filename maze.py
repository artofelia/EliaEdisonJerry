#this is our random maze generator
#2D array in Python with list tuple coordinate pairs as keys
#value for each key is:
# 0 = empty space
# 1 = wall

test = "hello"

#maze object (dictionary)
def maze(n):
    maze_keys = []
    for y in range(n):
        maze_keys = maze_keys + [(x,y) for x in range(n)]

    #initialize all maze tiles as walls
    maze_coordinates = {}
    for key in maze_keys:
        maze_coordinates[key] = 1

    #show maze as a list of tuples (coordinates)
    def show_maze_coordinates():
        for key in maze_keys:
            print str(key)
        print "######################"

    #return the maze as a dictionary
    def get_maze():
        return maze_coordinates

    #show maze as a string grid

    maze = ''
    for y in range(n):
        for x in range(n):
            maze_value = maze_coordinates[(x,y)]
            maze = maze + str(maze_value)
        maze = maze + "\n"
    print maze

def maze2(n):
    total_cells = n*n
    maze = []
    for x in range(total_cells):
        maze.append(x)
    return maze
