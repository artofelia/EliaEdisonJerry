#this is our random maze generator
#2D array in Python

test = "hello"


#maze object (dictionary)
def maze(n):
    maze_keys = []
    for y in range(n):
        maze_keys = maze_keys + [(x,y) for x in range(n)]
    #test
    for key in maze_keys:
        print str(key)
    print "######################"
    maze_coordinates = {}
    for key in maze_keys:
        maze_coordinates[key] = 0
    #test
    for value in maze_coordinates:
        print maze_coordinates[value]


#maze object
#produces an nxn maze
def maze2(n):
    maze = [[0 for x in range(n)] for x in range(n)]
    length = n
    #print the maze
    def show():
        output = ""
        #row
        for x in length:
            #column
            for y in length:
                cell = str([x][y])
                output = output + cell
            output = output + "\n"
        return output
    return show()

