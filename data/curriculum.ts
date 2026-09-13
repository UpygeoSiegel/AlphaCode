/**
 * CSP Ready curriculum map.
 *
 * Course → Unit (a programming topic) → Subtopic. Each subtopic is one assignable
 * Topic in Firestore (its `id` becomes the Firestore document ID). Units are grouped
 * by programming concept, not by College Board unit or Big Idea, so the three courses
 * line up: the same concept appears at increasing depth across Pre-AP, CSP, and CSA. Every subtopic defines three
 * difficulty levels; each template written for a subtopic targets exactly one
 * level, so a subtopic ends up with one or more templates per level.
 *
 * Level meanings (apply across every subtopic):
 *   I   – One concept, one step. Direct recall or a single evaluation.
 *   II  – Two concepts or two steps. Trace short code (3–6 lines), combine ideas.
 *   III – Multi-step. Trace longer code, handle edge cases, find bugs,
 *         choose between algorithms, or reason about efficiency.
 *
 * Language conventions per course:
 *   fundamentals – plain pseudocode / block-neutral (mirrors AP CSP reference sheet)
 *   csp          – AP CSP Exam Reference Sheet pseudocode (text form)
 *   csa          – Java, AP CSA subset
 */

export type Level = 1 | 2 | 3;

export interface Subtopic {
  id: string;
  name: string;
  description: string;
  /** What each level asks the student to do. Index 0 = Level I, 1 = Level II, 2 = Level III. */
  levels: [string, string, string];
}

export interface Unit {
  id: string;
  name: string;
  subtopics: Subtopic[];
}

export interface Course {
  id: string;
  name: string;
  language: "pseudocode" | "csp-pseudocode" | "java";
  units: Unit[];
}

export const CURRICULUM: Course[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // COURSE 1: PRE-AP COMPUTER SCIENCE (programming fundamentals)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "fund",
    name: "Pre-AP Computer Science",
    language: "pseudocode",
    units: [
      {
        id: "fund-variables",
        name: "Variables, Data Types & Expressions",
        subtopics: [
          {
            id: "fund-variables-assignment",
            name: "Variables & Assignment",
            description: "Storing values, reassigning variables, and tracing state.",
            levels: [
              "Evaluate a single assignment and report the variable's value.",
              "Trace 3–5 sequential assignments, including x ← x + 1 style updates.",
              "Trace a swap or multi-variable shuffle and report all final values.",
            ],
          },
          {
            id: "fund-data-types",
            name: "Data Types",
            description: "Integers, decimals, strings, and booleans; identifying and classifying values.",
            levels: [
              "Identify the data type of a literal value.",
              "Identify the type produced by an expression (e.g. 7 / 2, \"5\" + \"3\").",
              "Spot a type mismatch bug in a short program and pick the fix.",
            ],
          },
          {
            id: "fund-arithmetic",
            name: "Arithmetic & Order of Operations",
            description: "Evaluating arithmetic expressions with correct precedence.",
            levels: [
              "Evaluate an expression with two operators.",
              "Evaluate an expression with parentheses and three or more operators.",
              "Evaluate an expression involving variables from prior assignments.",
            ],
          },
          {
            id: "fund-div-mod",
            name: "Integer Division & Modulo",
            description: "DIV and MOD (remainder) behavior and typical uses.",
            levels: [
              "Evaluate a single a MOD b or a DIV b.",
              "Evaluate an expression combining MOD and DIV (e.g. extract tens digit).",
              "Determine what a short MOD-based program computes (even/odd, last digit, wraparound).",
            ],
          },
          {
            id: "fund-concat-output",
            name: "String Concatenation & Output",
            description: "Joining strings, mixing text with numbers, and predicting displayed output.",
            levels: [
              "Predict the output of a single DISPLAY with concatenation.",
              "Predict output of a DISPLAY mixing string and numeric variables.",
              "Predict multi-line output from several DISPLAY calls with computed values.",
            ],
          },
          {
            id: "fund-input-conversion",
            name: "Input & Type Conversion",
            description: "Reading input and converting between strings and numbers.",
            levels: [
              "Determine the type of a value returned by INPUT.",
              "Predict output when input is converted then used in arithmetic.",
              "Identify a bug caused by missing conversion and choose the correct fix.",
            ],
          },
        ],
      },
      {
        id: "fund-conditionals",
        name: "Conditionals & Boolean Logic",
        subtopics: [
          {
            id: "fund-relational",
            name: "Relational Operators",
            description: "Comparing values with <, >, ≤, ≥, =, ≠.",
            levels: [
              "Evaluate a single comparison to true or false.",
              "Evaluate a comparison whose operands are expressions.",
              "Determine the range of values for a variable that makes a comparison true.",
            ],
          },
          {
            id: "fund-logical",
            name: "Logical Operators (AND, OR, NOT)",
            description: "Combining boolean expressions.",
            levels: [
              "Evaluate one AND / OR / NOT expression with literal booleans.",
              "Evaluate a compound boolean with comparisons and two operators.",
              "Determine equivalence of two boolean expressions or apply De Morgan's laws.",
            ],
          },
          {
            id: "fund-if",
            name: "IF Statements",
            description: "Single-branch conditional execution.",
            levels: [
              "Determine whether the body of an IF executes for given values.",
              "Trace an IF that modifies a variable and report its final value.",
              "Trace a sequence of independent IFs (not chained) and report all effects.",
            ],
          },
          {
            id: "fund-if-else",
            name: "IF / ELSE",
            description: "Two-way branching.",
            levels: [
              "Determine which branch runs for a given value.",
              "Predict output of an IF/ELSE with computed conditions.",
              "Identify input values that produce a given output.",
            ],
          },
          {
            id: "fund-nested-conditionals",
            name: "Chained & Nested Conditionals",
            description: "ELSE IF ladders and IFs inside IFs.",
            levels: [
              "Determine which branch of an ELSE IF ladder runs.",
              "Trace nested IFs to find the output.",
              "Identify an ordering bug in a grading ladder or rewrite nested IFs as a compound condition.",
            ],
          },
        ],
      },
      {
        id: "fund-iteration",
        name: "Iteration",
        subtopics: [
          {
            id: "fund-repeat-n",
            name: "REPEAT n TIMES Loops",
            description: "Fixed-count repetition.",
            levels: [
              "Count how many times a body executes.",
              "Trace an accumulator inside a REPEAT loop.",
              "Trace a REPEAT loop where the body depends on a variable changed each iteration.",
            ],
          },
          {
            id: "fund-while",
            name: "REPEAT UNTIL / WHILE Loops",
            description: "Condition-controlled repetition.",
            levels: [
              "Determine how many iterations a simple counting loop performs.",
              "Trace a loop with a non-unit step or a decreasing counter.",
              "Detect an infinite loop or off-by-one error and choose the fix.",
            ],
          },
          {
            id: "fund-accumulators",
            name: "Accumulators & Counters",
            description: "Building sums, products, and counts inside loops.",
            levels: [
              "Compute the final value of a sum accumulated over a loop.",
              "Compute a product or count that only updates conditionally.",
              "Determine what a loop with accumulator computes (e.g. average, max) from its code.",
            ],
          },
          {
            id: "fund-nested-loops",
            name: "Nested Loops",
            description: "Loops inside loops.",
            levels: [
              "Count total body executions of two nested fixed loops.",
              "Predict printed pattern or final counter with dependent inner bound.",
              "Trace a nested loop with a conditional and an accumulator.",
            ],
          },
        ],
      },
      {
        id: "fund-procedures",
        name: "Procedures",
        subtopics: [
          {
            id: "fund-calling-procedures",
            name: "Calling Procedures",
            description: "Invoking a defined procedure with arguments.",
            levels: [
              "Determine the output of a single procedure call.",
              "Determine output when a procedure is called several times with different arguments.",
              "Trace procedure calls whose arguments are expressions or other calls.",
            ],
          },
          {
            id: "fund-parameters-return",
            name: "Parameters & Return Values",
            description: "Passing data in and getting a result back.",
            levels: [
              "Evaluate a call to a one-line RETURN procedure.",
              "Evaluate a procedure containing a conditional before RETURN.",
              "Evaluate a procedure that calls another procedure or has multiple RETURNs.",
            ],
          },
          {
            id: "fund-scope",
            name: "Scope",
            description: "Local vs. global variables and their lifetime.",
            levels: [
              "Identify whether a variable is local or global.",
              "Predict output when a local variable shadows a global.",
              "Trace a program where a procedure modifies a global and is called repeatedly.",
            ],
          },
        ],
      },
      {
        id: "fund-lists",
        name: "Lists",
        subtopics: [
          {
            id: "fund-list-indexing",
            name: "List Indexing & Length",
            description: "Accessing elements (1-indexed in CSP pseudocode) and LENGTH.",
            levels: [
              "Read a single element by index.",
              "Read an element whose index is an expression (e.g. LENGTH(list) - 1).",
              "Identify an out-of-bounds error in a short program.",
            ],
          },
          {
            id: "fund-list-modify",
            name: "Modifying Lists",
            description: "APPEND, INSERT, REMOVE, and element assignment.",
            levels: [
              "Report the list after one APPEND or element assignment.",
              "Report the list after INSERT and REMOVE operations.",
              "Report the list after a sequence of 4+ mixed operations.",
            ],
          },
          {
            id: "fund-list-traversal",
            name: "List Traversal",
            description: "FOR EACH loops over a list.",
            levels: [
              "Compute the sum or count of items via FOR EACH.",
              "Compute a conditional count or max via FOR EACH.",
              "Determine what a traversal algorithm computes from its code.",
            ],
          },
          {
            id: "fund-list-search",
            name: "Searching a List",
            description: "Linear search for a value or a property.",
            levels: [
              "Determine whether a value is in a list by inspection.",
              "Count comparisons needed for linear search to find a target.",
              "Trace a search procedure with an early RETURN and predict its result.",
            ],
          },
        ],
      },
      {
        id: "fund-strings",
        name: "Strings",
        subtopics: [
          {
            id: "fund-string-indexing",
            name: "String Length & Indexing",
            description: "Character access and length.",
            levels: [
              "Report the length of a string or the character at an index.",
              "Report a character at a computed index.",
              "Trace a loop that builds a new string character by character.",
            ],
          },
          {
            id: "fund-substrings-case",
            name: "Substrings & Case",
            description: "Slicing, upper/lower case, and combining substring operations.",
            levels: [
              "Evaluate a single substring or case operation.",
              "Evaluate a substring whose bounds are computed.",
              "Trace a procedure that combines several string operations (e.g. reverse, initials).",
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // COURSE 2: AP COMPUTER SCIENCE PRINCIPLES (coding topics, grouped by concept)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "csp",
    name: "AP Computer Science Principles",
    language: "csp-pseudocode",
    units: [
      {
        id: "csp-variables",
        name: "Variables, Expressions & Strings",
        subtopics: [
          {
            id: "csp-variables-assignment",
            name: "Variables & Assignments",
            description: "CSP pseudocode assignment (←) and value tracing.",
            levels: [
              "Report a variable's value after one assignment.",
              "Trace several assignments including a swap.",
              "Determine which code segment produces a specified final state.",
            ],
          },
          {
            id: "csp-math-expressions",
            name: "Mathematical Expressions",
            description: "Arithmetic with MOD and integer arithmetic in CSP pseudocode.",
            levels: [
              "Evaluate an expression with one MOD.",
              "Evaluate a multi-operator expression with MOD and variables.",
              "Determine which expression correctly computes a described quantity.",
            ],
          },
          {
            id: "csp-strings",
            name: "Strings",
            description: "String operations and concatenation in CSP pseudocode.",
            levels: [
              "Evaluate a single concatenation.",
              "Trace a loop building a string.",
              "Determine the procedure that produces a described string transformation.",
            ],
          },
        ],
      },
      {
        id: "csp-conditionals",
        name: "Conditionals & Boolean Logic",
        subtopics: [
          {
            id: "csp-boolean-expressions",
            name: "Boolean Expressions",
            description: "Relational and logical operators; truth tables.",
            levels: [
              "Evaluate a single comparison or NOT.",
              "Evaluate a compound AND/OR expression.",
              "Identify equivalent boolean expressions.",
            ],
          },
          {
            id: "csp-conditionals-if",
            name: "Conditionals",
            description: "IF and IF/ELSE in CSP pseudocode.",
            levels: [
              "Determine which branch executes.",
              "Predict output of IF/ELSE with computed condition.",
              "Determine which input values produce a given output.",
            ],
          },
          {
            id: "csp-nested-conditionals",
            name: "Nested Conditionals",
            description: "Conditionals within conditionals and equivalent restructurings.",
            levels: [
              "Trace a two-level nested IF.",
              "Trace a three-level nested IF/ELSE ladder.",
              "Identify the compound condition equivalent to a nested structure.",
            ],
          },
        ],
      },
      {
        id: "csp-iteration",
        name: "Iteration & Algorithms",
        subtopics: [
          {
            id: "csp-repeat-loops",
            name: "Iteration",
            description: "REPEAT n TIMES and REPEAT UNTIL loops.",
            levels: [
              "Count iterations of a REPEAT n TIMES loop.",
              "Trace an accumulator in a REPEAT UNTIL loop.",
              "Identify the loop that produces a described output or find an infinite loop.",
            ],
          },
          {
            id: "csp-developing-algorithms",
            name: "Developing Algorithms",
            description: "Sequencing, selection, iteration; equivalent algorithms.",
            levels: [
              "Identify whether an algorithm uses selection or iteration.",
              "Determine which of two algorithms produces the same result.",
              "Identify the algorithm that correctly solves a described problem.",
            ],
          },
          {
            id: "csp-random-values",
            name: "Random Values",
            description: "RANDOM(a, b) and reasoning about possible outcomes.",
            levels: [
              "Identify the possible outputs of RANDOM(a, b).",
              "Determine the probability of a condition on a RANDOM call.",
              "Determine possible outputs of an expression using two RANDOM calls.",
            ],
          },
          {
            id: "csp-debugging",
            name: "Identifying & Correcting Errors",
            description: "Syntax, logic, run-time, and overflow errors; debugging strategies.",
            levels: [
              "Classify an error as syntax, logic, run-time, or overflow.",
              "Identify the line that contains a logic error in a short program.",
              "Choose the correction that makes a buggy program meet its specification.",
            ],
          },
        ],
      },
      {
        id: "csp-procedures",
        name: "Procedures",
        subtopics: [
          {
            id: "csp-calling-procedures",
            name: "Calling Procedures",
            description: "Invoking built-in and user-defined procedures with arguments; using return values.",
            levels: [
              "Evaluate a single call to a defined procedure.",
              "Evaluate several calls with different arguments, including a call used inside an expression.",
              "Trace nested calls or a procedure whose argument is itself a procedure call.",
            ],
          },
          {
            id: "csp-developing-procedures",
            name: "Developing Procedures",
            description: "Writing procedures with parameters and RETURN; procedural abstraction.",
            levels: [
              "Identify the parameter list a procedure needs for a described task.",
              "Evaluate a procedure containing a conditional or loop before RETURN.",
              "Determine which procedure implementation matches a specification, or find its bug.",
            ],
          },
        ],
      },
      {
        id: "csp-lists",
        name: "Lists",
        subtopics: [
          {
            id: "csp-list-basics",
            name: "List Basics",
            description: "Using lists to manage complexity; 1-indexed list access.",
            levels: [
              "Read a list element by index.",
              "Report the list after INSERT / APPEND / REMOVE.",
              "Identify the code segment that transforms one list into another.",
            ],
          },
          {
            id: "csp-list-algorithms",
            name: "List Algorithms",
            description: "FOR EACH traversal; sum, average, max, count, and filter algorithms.",
            levels: [
              "Compute a sum via FOR EACH.",
              "Trace a max/min or conditional count algorithm.",
              "Determine what a list algorithm computes, or find its bug.",
            ],
          },
          {
            id: "csp-binary-search",
            name: "Binary Search",
            description: "Binary search procedure and its requirements.",
            levels: [
              "Identify that binary search requires a sorted list.",
              "Count the maximum number of steps for a list of size n.",
              "Trace binary search and report the sequence of elements examined.",
            ],
          },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // COURSE 3: AP COMPUTER SCIENCE A (Java, grouped by concept)
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "csa",
    name: "AP Computer Science A",
    language: "java",
    units: [
      {
        id: "csa-variables",
        name: "Variables, Data Types & Expressions",
        subtopics: [
          {
            id: "csa-primitives",
            name: "Variables & Primitive Types",
            description: "int, double, boolean declarations, initialization, and naming.",
            levels: [
              "Identify the correct type for a value or the value after one assignment.",
              "Trace several assignments and compound assignments (+=, ++).",
              "Identify a compile-time error in declarations or types.",
            ],
          },
          {
            id: "csa-arithmetic",
            name: "Arithmetic Expressions & Integer Division",
            description: "Operators, precedence, / and % on ints, and int/double mixing.",
            levels: [
              "Evaluate a single int division or modulo.",
              "Evaluate a mixed int/double expression.",
              "Evaluate a multi-step expression with precedence, %, and mixed types.",
            ],
          },
          {
            id: "csa-casting",
            name: "Casting & Ranges",
            description: "(int) and (double) casts, truncation, rounding, and Integer.MAX_VALUE.",
            levels: [
              "Evaluate a single cast.",
              "Evaluate an expression that rounds using casting.",
              "Predict the result of overflow at Integer.MAX_VALUE or precision loss.",
            ],
          },
          {
            id: "csa-output",
            name: "System.out.print & println",
            description: "Output formatting and string concatenation with numbers.",
            levels: [
              "Predict output of a single println with concatenation.",
              "Predict output where numeric addition precedes string concatenation.",
              "Predict multi-line output combining print and println with escape sequences.",
            ],
          },
        ],
      },
      {
        id: "csa-conditionals",
        name: "Conditionals & Boolean Logic",
        subtopics: [
          {
            id: "csa-boolean-expressions",
            name: "Boolean Expressions",
            description: "Relational operators, &&, ||, !, short-circuit evaluation.",
            levels: [
              "Evaluate a single boolean expression.",
              "Evaluate a compound boolean with && and ||.",
              "Apply De Morgan's laws or reason about short-circuit side effects.",
            ],
          },
          {
            id: "csa-if-else",
            name: "if / else if / else",
            description: "Selection statements and their control flow.",
            levels: [
              "Determine which branch executes.",
              "Trace an else-if ladder with computed conditions.",
              "Identify a logic error caused by branch ordering or missing braces.",
            ],
          },
          {
            id: "csa-nested-conditionals",
            name: "Nested Conditionals",
            description: "if inside if and dangling-else behavior.",
            levels: [
              "Trace a two-level nested if.",
              "Trace nested if/else with a dangling else.",
              "Identify the equivalent single compound condition.",
            ],
          },
          {
            id: "csa-comparing-objects",
            name: "Comparing Objects",
            description: "== vs. equals for Strings and objects.",
            levels: [
              "Determine the result of equals on two String literals.",
              "Determine the result of == vs. equals on distinct String objects.",
              "Identify the bug in an object comparison and choose the fix.",
            ],
          },
        ],
      },
      {
        id: "csa-iteration",
        name: "Iteration",
        subtopics: [
          {
            id: "csa-while",
            name: "while Loops",
            description: "Condition-controlled loops and sentinel values.",
            levels: [
              "Count iterations of a simple while loop.",
              "Trace a while loop with an accumulator.",
              "Detect an infinite loop or off-by-one error.",
            ],
          },
          {
            id: "csa-for",
            name: "for Loops",
            description: "Counter-controlled loops with various steps and bounds.",
            levels: [
              "Count iterations of a for loop.",
              "Trace a for loop with a non-unit step or decreasing counter.",
              "Rewrite a while loop as an equivalent for loop or vice versa.",
            ],
          },
          {
            id: "csa-nested-loops",
            name: "Nested Loops",
            description: "Loops inside loops; execution counts and patterns.",
            levels: [
              "Count total inner-body executions.",
              "Predict a printed pattern of characters.",
              "Trace nested loops with a dependent inner bound and conditional.",
            ],
          },
          {
            id: "csa-runtime-analysis",
            name: "Informal Run-Time Analysis",
            description: "Counting statement executions as a function of n.",
            levels: [
              "Count executions of a statement in a single loop.",
              "Count executions in nested loops with fixed bounds.",
              "Count executions with a triangular (i < j) nested loop structure.",
            ],
          },
        ],
      },
      {
        id: "csa-strings",
        name: "Strings",
        subtopics: [
          {
            id: "csa-string-methods",
            name: "String Methods",
            description: "length, substring, indexOf, equals, compareTo, and immutability.",
            levels: [
              "Evaluate a single substring or length call.",
              "Evaluate combined calls (substring with indexOf; compareTo sign).",
              "Trace a short algorithm that uses String methods to transform text.",
            ],
          },
          {
            id: "csa-string-algorithms",
            name: "String Algorithms",
            description: "Loops over characters: counting, reversing, finding substrings.",
            levels: [
              "Count characters matching a condition.",
              "Trace a loop that builds a reversed or filtered string.",
              "Determine what a String algorithm does or find its bug.",
            ],
          },
        ],
      },
      {
        id: "csa-using-objects",
        name: "Using Objects & Methods",
        subtopics: [
          {
            id: "csa-objects-constructors",
            name: "Objects & Constructors",
            description: "Instantiating objects, reference variables, and null.",
            levels: [
              "Identify the correct constructor call for a given class header.",
              "Determine what two references point to after assignment.",
              "Predict a NullPointerException or aliasing effect.",
            ],
          },
          {
            id: "csa-calling-methods",
            name: "Calling Methods",
            description: "Void and non-void methods, parameters, return values, method signatures.",
            levels: [
              "Identify the return type or number of parameters from a signature.",
              "Evaluate a chain of method calls on an object.",
              "Identify a compile error from misuse of a void method or wrong argument types.",
            ],
          },
          {
            id: "csa-math-wrappers",
            name: "Math Class & Wrapper Classes",
            description: "Math.abs, pow, sqrt, random; Integer and Double wrappers and autoboxing.",
            levels: [
              "Evaluate a single Math call.",
              "Determine the range of (int)(Math.random() * n) + k.",
              "Write or identify the expression producing a random int in a given range.",
            ],
          },
        ],
      },
      {
        id: "csa-writing-classes",
        name: "Writing Classes",
        subtopics: [
          {
            id: "csa-class-anatomy",
            name: "Anatomy of a Class",
            description: "Instance variables, private/public, and the class header.",
            levels: [
              "Identify the instance variables of a class.",
              "Identify the correct access modifier for a stated design goal.",
              "Identify the encapsulation violation in a class definition.",
            ],
          },
          {
            id: "csa-constructors",
            name: "Constructors",
            description: "Writing constructors, overloading, and initialization.",
            levels: [
              "Identify the constructor that matches a given call.",
              "Determine an object's state after a constructor runs.",
              "Identify the constructor body that correctly initializes a class given a spec.",
            ],
          },
          {
            id: "csa-accessors-mutators",
            name: "Accessor & Mutator Methods",
            description: "Getters, setters, and toString.",
            levels: [
              "Identify the correct getter signature.",
              "Predict output after calls to setters and getters.",
              "Identify the correct mutator implementation with validation.",
            ],
          },
          {
            id: "csa-writing-methods",
            name: "Writing Methods",
            description: "Methods that use instance variables and parameters; return vs. side effects.",
            levels: [
              "Identify the return type a method needs.",
              "Trace a method that reads and modifies instance variables.",
              "Choose the method implementation that satisfies a postcondition.",
            ],
          },
          {
            id: "csa-static",
            name: "Static Variables & Methods",
            description: "Class-level state and behavior; static vs. instance.",
            levels: [
              "Identify whether a variable should be static.",
              "Trace a static counter across several object creations.",
              "Identify an error from accessing instance data in a static context.",
            ],
          },
          {
            id: "csa-scope-this",
            name: "Scope & this",
            description: "Local vs. instance variable scope and the this keyword.",
            levels: [
              "Identify the scope of a variable.",
              "Predict output when a parameter shadows an instance variable.",
              "Identify the bug caused by missing this in a constructor.",
            ],
          },
        ],
      },
      {
        id: "csa-inheritance",
        name: "Inheritance & Polymorphism",
        subtopics: [
          {
            id: "csa-inheritance-super",
            name: "Inheritance & super",
            description: "extends, superclass constructors, and inherited members.",
            levels: [
              "Identify which members a subclass inherits.",
              "Predict output of a subclass constructor that calls super.",
              "Identify the compile error in a subclass constructor or missing super call.",
            ],
          },
          {
            id: "csa-overriding-polymorphism",
            name: "Method Overriding & Polymorphism",
            description: "Overriding, dynamic dispatch, and superclass reference types.",
            levels: [
              "Identify whether a method is overridden.",
              "Predict output when a superclass reference calls an overridden method.",
              "Trace polymorphic calls through a three-class hierarchy with super calls.",
            ],
          },
          {
            id: "csa-object-superclass",
            name: "Object Superclass",
            description: "toString and equals from Object and overriding them.",
            levels: [
              "Identify what default toString prints.",
              "Predict output after overriding toString.",
              "Identify the correct equals override for a class.",
            ],
          },
        ],
      },
      {
        id: "csa-arrays",
        name: "Arrays",
        subtopics: [
          {
            id: "csa-1d-arrays",
            name: "1D Arrays",
            description: "Declaration, initialization, indexing, length, and bounds.",
            levels: [
              "Read an element or the length of an array.",
              "Report array state after several assignments.",
              "Identify an ArrayIndexOutOfBoundsException in a loop.",
            ],
          },
          {
            id: "csa-array-traversal",
            name: "Traversing Arrays",
            description: "Standard for and enhanced for loops over arrays.",
            levels: [
              "Compute the sum of an array via a loop.",
              "Compute a conditional count or max.",
              "Identify why an enhanced for loop fails to modify an array.",
            ],
          },
          {
            id: "csa-array-algorithms",
            name: "Array Algorithms",
            description: "Min/max, average, shift, reverse, check-all/any, duplicates.",
            levels: [
              "Trace a max-finding loop.",
              "Trace a reverse or shift algorithm.",
              "Determine what an array algorithm does or find its bug.",
            ],
          },
          {
            id: "csa-2d-arrays",
            name: "2D Arrays",
            description: "Row-major declaration, indexing, and nested traversal.",
            levels: [
              "Read an element from a 2D array.",
              "Compute a row or column sum.",
              "Trace a nested traversal with a conditional or column-major order.",
            ],
          },
        ],
      },
      {
        id: "csa-arraylist",
        name: "ArrayList",
        subtopics: [
          {
            id: "csa-arraylist-basics",
            name: "ArrayList",
            description: "add, get, set, remove, size; index shifting and wrapper types.",
            levels: [
              "Report the list after one add or set.",
              "Report the list after add(index) and remove with index shifting.",
              "Trace a loop that removes elements and reason about skipped indices.",
            ],
          },
          {
            id: "csa-arraylist-algorithms",
            name: "ArrayList Algorithms",
            description: "Traversal, insertion, deletion, and building lists.",
            levels: [
              "Compute a sum or count over an ArrayList.",
              "Trace a loop that inserts or removes while traversing.",
              "Identify the correct algorithm for a described ArrayList transformation.",
            ],
          },
        ],
      },
      {
        id: "csa-recursion-search-sort",
        name: "Recursion, Searching & Sorting",
        subtopics: [
          {
            id: "csa-recursion",
            name: "Recursion",
            description: "Base cases, recursive calls, and tracing recursive methods.",
            levels: [
              "Identify the base case of a recursive method.",
              "Evaluate a recursive method for a small input.",
              "Count calls or trace a recursive method with two recursive calls.",
            ],
          },
          {
            id: "csa-searching",
            name: "Searching",
            description: "Linear and binary search on arrays and ArrayLists.",
            levels: [
              "Determine the result of a linear search.",
              "Count comparisons for binary search to find a target.",
              "Trace binary search and report the sequence of midpoints.",
            ],
          },
          {
            id: "csa-sorting",
            name: "Sorting",
            description: "Selection sort, insertion sort, and merge sort.",
            levels: [
              "Report the array after one pass of selection sort.",
              "Report the array after k passes of insertion sort.",
              "Identify the sort from a trace or compare comparison counts.",
            ],
          },
          {
            id: "csa-recursive-search-sort",
            name: "Recursive Searching & Sorting",
            description: "Recursive binary search and merge sort structure.",
            levels: [
              "Identify the recursive case in recursive binary search.",
              "Trace one level of merge sort splitting.",
              "Determine the sequence of merges in merge sort for a small array.",
            ],
          },
        ],
      },
    ],
  },
];

/** Flattened list of every subtopic with its course and unit for seeding or display. */
export function flattenCurriculum(): Array<{
  course: Course;
  unit: Unit;
  subtopic: Subtopic;
}> {
  const out: Array<{ course: Course; unit: Unit; subtopic: Subtopic }> = [];
  for (const course of CURRICULUM) {
    for (const unit of course.units) {
      for (const subtopic of unit.subtopics) {
        out.push({ course, unit, subtopic });
      }
    }
  }
  return out;
}

export const LEVEL_LABELS: Record<Level, string> = {
  1: "Level I",
  2: "Level II",
  3: "Level III",
};
