#include <iostream>
#include <stack>
using namespace std;

class Stack {
    int SIZE = 50;
    string arr[50];  
    int top;

public:
    Stack() {
        top = -1;
    }

    void push(string ele) {
        if (top == SIZE - 1) {
            cout << "Stack is full" << endl;
        } else {
            arr[++top] = ele;
        }
    }

    string pop() {
        if (top == -1) {
            cout << "Stack is Empty";
            return "";
        } else {
            return arr[top--];
        }
    }

    int isEmpty() {
        return (top == -1);
    }

    string stackTop() {
        if (top == -1) {
            return "";  
        } else {
            return arr[top];
        }
    }
};


bool isOperator(char x) {
    switch (x) {
        case '+':
        case '-':
        case '/':
        case '*':
        case '^':
        case '%':
            return true;
    }
    return false;
}


string preToInfix(string pre_exp) {
    Stack s;


    int length = pre_exp.size();

    
    for (int i = length - 1; i >= 0; i--) {

        
        if (isOperator(pre_exp[i])) {

            
            string op1 = s.pop();
            string op2 = s.pop();

            
            string temp = "(" + op1 + pre_exp[i] + op2 + ")";

            
            s.push(temp);
        }

        
        else {

            
            s.push(string(1, pre_exp[i]));
        }
    }

    
    return s.pop();
}


int main() {
    string pre_exp;
    cout << "Enter the prefix expression: ";
    cin >> pre_exp;
    cout << "Infix : " << preToInfix(pre_exp);
    return 0;
}

