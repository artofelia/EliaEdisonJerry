#random maze generator
#source code: http://stackoverflow.com/questions/27017164/python-maze-generator-explanation

from random import shuffle, randrange

#creates a maze grid with a 3-wide path
#the size is actually 8n+1 by 8n+1) because n represents one 4x2 cell of the maze (the 8 comes from the fact that a 4x2 cell contains 8 elements and the +1 comes from the border of the maze)
#the maze algorithm works by moving in a random direction every recursive call
#it checks for possible paths by either placing a wall, a path space, or backtracking

def make_maze(n):
    w = n*2
    h = n
    vis = [[0] * w + [1] for _ in range(h)] + [[1] * (w + 1)]
    ver = [["+   "] * w + ['+'] for _ in range(h)] + [[]]
    hor = [["++++"] * w + ['+'] for _ in range(h + 1)]

    def walk(x, y):
        vis[y][x] = 1
        d = [(x - 1, y), (x, y + 1), (x + 1, y), (x, y - 1)]
        shuffle(d)
        for (xx, yy) in d:
            if vis[yy][xx]: continue
            if xx == x: hor[max(y, yy)][x] = "+   "
            if yy == y: ver[y][max(x, xx)] = "    "
            walk(xx, yy)

    walk(randrange(w), randrange(h))
    maze = ""
    for (a, b) in zip(hor, ver):
        maze = maze + (''.join(a + ['\n']) * 3) + ( ''.join(b + ["\n"]) * 3)
    print maze

    #convert the visual maze into a list of indices where the consecutive numbers indicate places where there are walls
    maze_values = list(maze)
    maze_array = []
    count = 0
    for x in maze_values:
        if x == "+":
            maze_array.append(count)
        count = count + 1
    print maze_array

    #return dictionary containing the maze array and the intial size of the maze
    response = {"data":  maze_array,
                "size": (8*n) + 1
    }

    return response
