
import websocket, json, sys, argparse
#server = "ws://miin.thechiao.com:8001"
server = "ws://localhost:8001"

class c4client:

    def __init__(self, name , against=None):
        self.ws = websocket.create_connection(server)
        self.name = name
        self.against = against

    def start_game():
        ws.send(json.dumps({"type" : "start",  "id" : self.name, "against" : self.against}))
        print("Waiting for game to start")

while 1:
    msg = json.loads(ws.recv())
    msg_type = msg["type"]
    byebye = ({"end" : "Game has ended",
               "disconnected" : "Other player has disconnected"}
              .get(msg_type, None))
    if byebye:
        print(byebye)
        observer = None
        start_game()
        continue

    if msg_type == "ignored":
        print("Invalid input, try again")
        ws.send(json.dumps({"type" : "state_request"}))
        continue

    if msg_type == "state":
        you = msg["you"]
        turn = msg["turn"]
        print("Your side:", you)
        print("Board:")
        print_board(msg["state"])
        winner = msg.get("winner", None)

        # Do learning bookkeeping
        reward = 0
        if observer and (turn == you or winner != None):
            if winner == None:
                observer(reward = 0, new_state = msg["state"])
            else:
                if winner == 0:
                    reward = 0
                elif winner == you:
                    reward = 1
                else:
                    reward = -1
                observer(reward = reward, new_state = None)
            observer = None

        if winner != None:
            print(winner, "has won")
            continue

        if turn == you:
            move, observer = engine.get_move(msg["state"], you)
            ws.send(json.dumps({"type" : "move",  "move" : move}))
        else:
            print("Waiting for other player to play")

