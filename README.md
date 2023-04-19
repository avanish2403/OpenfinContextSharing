# OpenfinContextSharing
Context sharing through Openfin

# Getting Started

Please follow below steps to setup the repo:
1. Open VS Code Terminal and Run the “yarn setup" command to install the dependencies.

2. After completing the above command, run the "yarn build" & “yarn openfin:build” command to build the application of both react side and openfin side.

3. After completing the above command, run the “yarn start” command to run the application.

4. Open a new Terminal window by clicking on the “+” icon and run thr "yarn openfin" command. [**To run OpenFin Server**]

# Issues that have to be handled with this sample

1. Once the project is running, the dock will appear with two icon, one for TradingTicket and second for Blotter. Open the Blotter UI and click on the "Send Data" button. This will call a method the send the hard-coded data to the TradingTicket and at the same time it will create a window for TradingTicket (with the help of createWindow code).

Now, the new window will appear with the data which was sent using that "Send Data" button.
Now open TradingTicket from Dock, you'll see that the data which was sent earlier is still displaying on the UI. For removing the same,when the TradingTicket is opened from Dock, I have tried all the possible way to remove the context which was shared earlier but non of the approach was working.

2. When we click on "Send data" button it will create a window. Minimize the created window and again click on "Send data" button, nothing will happen. Here I want that the window which is minimized gets in the front of the screen id that button is clicked again.
