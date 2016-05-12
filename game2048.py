import copy
import random
import functools

def push_all_rows(grid, left=True):
    """
    Perform a horizontal shift on all rows.
    Pass left=True for left and left=False for right.
    The grid will be changed inplace.
    """
    moved = False
    score = 0
    rows, columns = len(grid), len(grid[0])
    for row in grid:
        if left:
            i, d, it = 0, 1, row
        else:
            i, d, it = columns-1, -1, reversed(row)
        last  = 0
        for e in it:
            if e:
                if e == last:
                    row[i-d]+=e
                    score += e
                    last = 0
                    moved = True
                else:
                    if (not moved) and row[i]==0:
                        moved = True
                    last=row[i]=e
                    i+=d
        while 0<=i<columns:
            row[i]=0
            i+=d
    return moved, score



def push_all_columns(grid, up=True):
    """
    Perform a vertical shift on all columns.
    Pass up=True for up and up=False for down.
    The grid will be changed inplace.
    """
    moved = False
    score = 0
    rows, columns = len(grid), len(grid[0])
    for k in range(columns):
        if up:
            i, d, it = 0, 1, range(rows)
        else:
            i, d, it = 3, -1, range(rows-1,-1,-1)
        last  = 0
        for j in it:
            e = grid[j][k]
            if e:
                if e == last:
                    score += e
                    grid[i-d][k]+=e
                    last = 0
                    moved = True
                else:
                    if i != j:
                        moved = True
                    last=grid[i][k]=e
                    i+=d
        while 0<=i<rows:
            grid[i][k]=0
            i+=d
    return moved, score

def get_empty_cells(grid):
    """Return a list of coordinate pairs corresponding to empty cells."""
    return  [(j,i) for j, row in enumerate(grid)
                     for i, val in enumerate(row)
                        if not val]


def any_possible_moves(grid):
    """Return True if there are any legal moves, and False otherwise."""
    rows, columns = len(grid), len(grid[0])
    for i in range(rows):
        for j in range(columns):
            if not grid[i][j]:
                return True
            if j and grid[i][j] == grid[i][j-1]:
                return True
            if i and grid[i][j] == grid[i-1][j]:
                return True
    return False


def get_start_grid(cols=4, rows=4):
    """Create the start grid and seed it with two numbers."""
    grid = [[0]*cols for i in range(rows)]
    for i in range(2):
        empties = get_empty_cells(grid)
        y, x = random.choice(empties)
        grid[y][x] = 2 if random.random() < 0.9 else 4
    return grid


def prepare_next_turn(grid):
    """
    Spawn a new number on the grid; then return the result of
    any_possible_moves after this change has been made.
    """
    empties = get_empty_cells(grid)
    y, x = random.choice(empties)
    grid[y][x] = 2 if random.random() < 0.9 else 4
    return len(empties)>1 or any_possible_moves(grid)


def print_grid(grid):
    """Print a pretty grid to the screen."""
    print("")
    wall = "+------"*len(grid[0])+"+"
    print(wall)
    for row in grid:
        meat = "|".join("{:^6}".format(val) for val in row)
        print("|{}|".format(meat))
        print(wall)


class Game:
    def __init__(self, cols=4, rows=4):
        self.grid = get_start_grid(cols, rows)
        self.score = 0
        self.end = False
    
    def copy(self):
        rtn = Game()
        rtn.grid = copy.deepcopy(self.grid)
        rtn.end = self.end
        return rtn

    def max(self):
        return max(i for row in self.grid for i in row)

    def move(self, direction):
        push_func = push_all_columns if direction&1 else push_all_rows
        moved, score = push_func(self.grid, direction<2)
        if not moved:
            return None
        self.score += score
        if not prepare_next_turn(self.grid):
            self.end = True
        return True

    def display(self):
        print_grid(self.grid)
