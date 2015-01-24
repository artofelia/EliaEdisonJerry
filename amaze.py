#random maze generator
#source code: http://stackoverflow.com/questions/27017164/python-maze-generator-explanation

from random import shuffle, randrange

#creates a maze grid
#the size is actually 2n+1 by 2n+1 because n represents one 2x2 cell of the maze (the +1 comes from border of the maze)
#the maze algorithm works by moving in a random direction every recursive call
#it checks for possible paths by either placing a wall, a path space, or backtracking

def make_maze(n):
    w = n
    h = n
    vis = [[0] * w + [1] for _ in range(h)] + [[1] * (w + 1)]
    ver = [["+ "] * w + ['+'] for _ in range(h)] + [[]]
    hor = [["++"] * w + ['+'] for _ in range(h + 1)]

    def walk(x, y):
        vis[y][x] = 1
        d = [(x - 1, y), (x, y + 1), (x + 1, y), (x, y - 1)]
        shuffle(d)
        for (xx, yy) in d:
            if vis[yy][xx]: continue
            if xx == x: hor[max(y, yy)][x] = "+ "
            if yy == y: ver[y][max(x, xx)] = "  "
            walk(xx, yy)

    walk(randrange(w), randrange(h))
    maze = ""
    for (a, b) in zip(hor, ver):
        maze = maze + (''.join(a + ['\n'] + b)) +"\n"
    print maze

    #convert the visual maze into a list of indices where the consecutive numbers indicate places where there are walls
    maze_values = list(maze)
    maze_array = []
    count = 0
    for x in maze_values:
        if x == "+":
            maze_array.append(count)
        count = count + 1

    #return dictionary containing the maze array and the intial size of the maze
    response = {"data":  maze_array,
                "size": (n*2) + 1}

    return response
