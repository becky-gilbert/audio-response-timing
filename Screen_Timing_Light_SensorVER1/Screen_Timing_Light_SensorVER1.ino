//////////////////////////
const byte interruptPin = 2;
const byte outPutAux = 12;  //toggle status LED
volatile byte state = LOW;
bool val = true;
//////////////////////////

////////tone settings/////
int pin = 6; //tone pin
int frequency = 1000; //Hz
int duration = 500; //mS
/////////////////////////


void setup() {
  pinMode(pin, OUTPUT); //tone pin as output
  pinMode(outPutAux, OUTPUT); //set as output
  pinMode(interruptPin, INPUT);
  digitalWrite(outPutAux, val); // val = 1 so LED to be on start
  attachInterrupt(digitalPinToInterrupt(interruptPin), playTone, RISING); //int pin 2, sub as playTone, on rising edge of input   
}


void loop() {
}


void playTone() {
    noInterrupts();
    val = !val; //toggle LED value
    tone(pin, frequency, duration); //play a tone 
    interrupts();
    digitalWrite(outPutAux, val); //toggle status LED state
}
