const fs = require('fs');
const readlineSync = require('readline-sync');

class LibraryManagementSystem {
  constructor() {
    this.users = {
      "admin": "admin123"
    };
    this.books_dict = {};
    this.currentUserType = '';
  }
  authenticate() {
    const validUsername = "admin";
    const validPassword = "admin123";
  
    while (true) {
      const username = readlineSync.question("Enter your username: ");
      const password = readlineSync.question("Enter your password: ");
  
      if (username === validUsername && password === validPassword) {
        console.log("Authentication successful!");
        return true;
      } else {
        console.log("Authentication failed. Invalid username or password. Retrying...");
      }
    }
  }
  
  readBooksData() {
    try {
      const data = fs.readFileSync("books.json", 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`Error reading books file: ${error.message}`);
      return {};
    }
  }

  writeBooksData() {
    try {
      fs.writeFileSync("books.json", JSON.stringify(this.books_dict, null, 2));
      console.log("Books data updated in JSON file.");
    } catch (error) {
      console.log(`Error writing books data to file: ${error.message}`);
    }
  }

  initializeBooks(list_of_books) {
    try {
      const booksData = this.readBooksData();
      if (Object.keys(booksData).length === 0) {
        let id = 101;
        const content = fs.readFileSync(list_of_books, 'utf8').split('\n');
        for (let line of content) {
          this.books_dict[id.toString()] = {
            'books_title': line.replace("\n", ""),
            'quantity': 100,
            'price': 100,
            'total_price': 0,
            'lender_name': '',
            'lend_date': '',
            'status': 'Available'
          };
          id += 1;
        }
        this.writeBooksData();
      } else {
        this.books_dict = booksData;
      }
    } catch (error) {
      console.log(`Error initializing books: ${error.message}`);
    }
  }

  signup() {
    const userData = this.loadUserData();
    let signupSuccessful = false;
  
    while (!signupSuccessful) {
      let email = readlineSync.question('Enter your email: ');
  
      if (userData[email]) {
        console.log('Email already exists. Please use a different email.');
        continue; 
      }
  
      let phoneNumber;
  
      const password = readlineSync.question('Enter your password: ');
      const name = readlineSync.question('Enter your name: ');
  
      userData[email] = { password, name, phoneNumber, email };
      this.saveUserData(userData);
      
      console.log('Signup successful!');
      signupSuccessful = true;
      
      this.loggedInUser = email;
    }
  }
  

  loadUserData() {
    try {
      const data = fs.readFileSync('user_data.json', 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  saveUserData(userData) {
    fs.writeFileSync('user_data.json', JSON.stringify(userData, null, 2));
  }



  writeIssuedBooksData(userEmail, bookId, data) {
    try {
      let issuedBooksData = this.readIssuedBooksData();
      if (!issuedBooksData[userEmail]) {
        issuedBooksData[userEmail] = {};
      }
      issuedBooksData[userEmail][bookId] = data;
      fs.writeFileSync("issued_books.json", JSON.stringify(issuedBooksData, null, 2));
      console.log("Issued books data updated in JSON file.");
    } catch (error) {
      console.log(`Error writing issued books data to file: ${error.message}`);
    }
  }
  
  readIssuedBooksData() {
    try {
      const data = fs.readFileSync("issued_books.json", 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`Error reading issued books file: ${error.message}`);
      return {};
    }
  }

  login() {
    const userData = this.loadUserData();
    let email, password;
    let loginSuccessful = false;

    while (!loginSuccessful) {
      email = readlineSync.question('Enter your email: ');
      password = readlineSync.question('Enter your password: ', { hideEchoBack: true });

      if (userData[email] && userData[email].password === password) {
        console.log('Login successful!');
        this.loggedInUser = email; 
        loginSuccessful = true;
      } else {
        console.log('Login failed. Please check your email and password.');
      }
    }
  }


  issueBooks() {
    const books_id = readlineSync.question("Enter Books ID : ");
    const current_date = new Date().toLocaleString();
  
    if (!this.loggedInUser) {
      this.login();
      if (!this.loggedInUser) {
        console.log("Login failed. Exiting...");
        process.exit();
      }
    }
  
    const currentUserEmail = this.loggedInUser;
  
    if (books_id in this.books_dict) {
      if (this.books_dict[books_id]["quantity"] <= 0) {
        console.log("Sorry, this book is out of stock. Cannot issue.");
      } else {
        if (this.books_dict[books_id]["quantity"] > 0) {
          this.books_dict[books_id]["lender_name"] = currentUserEmail;
          this.books_dict[books_id]["lend_date"] = current_date;
          this.books_dict[books_id]["status"] = 'Already Issued';
          this.books_dict[books_id]["quantity"] -= 1;
          this.writeBooksData();
  
          this.writeIssuedBooksData(currentUserEmail, books_id, {
            'books_title': this.books_dict[books_id]["books_title"],
            'lend_date': current_date,
            'status': 'Already Issued'
          });
  
          console.log(`Book Issued Successfully to ${currentUserEmail}!`);
        } else {
          console.log("Sorry, this book is out of stock. Cannot issue.");
        }
      }
    } else {
      console.log("Book ID Not Found !!!");
    }
  }
  
  returnBooks() {
    if (!this.loggedInUser) {
      console.log("You need to log in first. Exiting...");
      return;
    }
  
    const currentUserEmail = this.loggedInUser;
  
    const issuedBooksData = this.readIssuedBooksData();
  
    if (issuedBooksData[currentUserEmail]) {
      console.log(`Books currently issued to ${currentUserEmail}:`);
  
      for (const bookId in issuedBooksData[currentUserEmail]) {
        const bookInfo = issuedBooksData[currentUserEmail][bookId];
        console.log(`Book ID: ${bookId}, Title: ${bookInfo.books_title}, Status: ${bookInfo.status}`);
      }
  
      const books_id = readlineSync.question("Enter Books ID to return: ");
  
      if (issuedBooksData[currentUserEmail][books_id]) {
        const bookInfo = issuedBooksData[currentUserEmail][books_id];
        const return_date = new Date().toLocaleString();
        const lend_date = new Date(bookInfo.lend_date).toLocaleString();
  
        if (this.books_dict[books_id]["status"] === 'Available') {
          console.log("This book is already available in the library. Please check the book ID.");
          return;
        }
  
        this.books_dict[books_id]["lender_name"] = '';
        this.books_dict[books_id]["return_date"] = return_date;
        this.books_dict[books_id]["status"] = 'Available';
        this.books_dict[books_id]["quantity"] += 1;
  
        const rentDays = Math.ceil((new Date(return_date) - new Date(lend_date)) / (1000 * 60 * 60 * 24));
        const rentAmount = rentDays * this.books_dict[books_id]["price"];
  
        this.books_dict[books_id]["rent_amount"] = rentAmount;
  
        this.writeBooksData();
  
        console.log(`Book returned successfully! Rent Amount for ${rentDays} days: $${rentAmount}`);
        console.log("Processing payment...");
  
        let remainingAmount = rentAmount;
  
        while (remainingAmount > 0) {
          let payment = parseFloat(readlineSync.question(`Enter the payment (Remaining amount: $${remainingAmount}): `));
          if (isNaN(payment) || payment < 0) {
            console.log("Invalid input. Please enter a valid payment amount.");
            continue;
          }
  
          if (payment >= remainingAmount) {
            console.log(`Payment successful! Remaining amount: $${remainingAmount - payment}`);
            remainingAmount = 0;
          } else {
            remainingAmount -= payment;
            console.log(`You still owe $${remainingAmount}. Please make another payment.`);
          }
        }
  
        this.removeIssuedBookEntry(currentUserEmail, books_id);
      } else {
        console.log("Invalid Book ID. Please enter a valid Book ID.");
      }
    } else {
      console.log("You don't have any books issued at the moment.");
    }
  }
  

  removeIssuedBookEntry(userEmail, bookId) {
    try {
      let issuedBooksData = this.readIssuedBooksData();
  
      if (issuedBooksData[userEmail] && issuedBooksData[userEmail][bookId]) {
        delete issuedBooksData[userEmail][bookId];
  
       
        if (Object.keys(issuedBooksData[userEmail]).length === 0) {
          delete issuedBooksData[userEmail];
        }
  
        fs.writeFileSync("issued_books.json", JSON.stringify(issuedBooksData, null, 2));
        console.log(`Issued book entry for user ${userEmail} and book ID ${bookId} removed.`);
      } else {
        console.log("Issued book entry not found for removal.");
      }
    } catch (error) {
      console.log(`Error removing issued book entry: ${error.message}`);
    }
  }
  
  

  addBooks() {
    const new_books = readlineSync.question("Enter Books Title : ");
    const quantity = parseInt(readlineSync.question("Enter Quantity : "));
    const price = parseFloat(readlineSync.question("Enter Price : "));
  
    if (new_books === "" || isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
      console.log("Invalid input. Please provide valid details.");
      this.addBooks();
      return;
    }
  
    try {
      const booksData = this.readBooksData();
  
      const newBookId = (parseInt(Math.max(...Object.keys(booksData))) + 1).toString();
  
      booksData[newBookId] = {
        'books_title': new_books,
        'quantity': quantity,
        'price': price,
        'total_price': quantity * price,
        'status': 'Available'
      };
  
      fs.writeFileSync("books.json", JSON.stringify(booksData, null, 2));
      console.log(`The book '${new_books}' has been added successfully !!!`);
    } catch (error) {
      console.log(`Error writing to file: ${error.message}`);
    }
  }
  
  

  displayBooks() {
    console.log("------------------------List of Books---------------------");

    const booksArray = [];

    for (let i in this.books_dict) {
      const { books_title, price, status,quantity } = this.books_dict[i];
      booksArray.push({ Id: i, Title: books_title, Price: price, Status: status ,Quantity:quantity});
    }

    console.table(booksArray);
    console.log("----------------------------------------------------------");
  }
  mainMenu() {
    let exitRequested = false;

    while (!exitRequested) {
      console.log("Are you an admin or customer?\n1. Admin\n2. Customer\n3. Exit");
      let option = readlineSync.question("Enter the option: ");

      switch (option) {
        case "1":
          this.adminMenu();
          break;
        case "2":
          this.customerMenu();
          break;
        case "3":
          console.log("Exiting...");
          exitRequested = true;
          break;
        default:
          console.log("Invalid option. Please enter 1, 2, or 3.");
      }
    }
  }

  runLibraryManagementSystem(list_of_books, library_name) {
    let goBack = false;

    while (!goBack) {
      console.log(`\n----------Welcome To Library Management System---------\n`);
      console.log(`Press A to Add Books`);
      console.log(`Press D to Display Books`);
      console.log(`Press Q to Quit`);
      console.log(`Press B to Go Back`);

      let key_press = readlineSync.question("Press Key : ").toUpperCase();

      switch (key_press) {
        case "A":
          console.log("\nCurrent Selection : ADD BOOK\n");
          this.addBooks();
          break;
        case "D":
          console.log("\nCurrent Selection : DISPLAY BOOKS\n");
          this.displayBooks();
          break;
        case "Q":
          this.writeBooksData();
          console.log("Exiting Library Management System.");
          process.exit();
          break;
        case "B":
          console.log("Going back to the main menu...");
          goBack = true;
          break;
        default:
          console.log("Invalid selection. Please try again.");
      }
    }
  }

  adminMenu() {
    console.log("Admin functionality (to be implemented)");
    if (!this.authenticate()) {
      return;
    }
    
    this.runLibraryManagementSystem("list_of_books.txt", "library_name");
  }



  goBack() {
    if (this.menuStack.length > 0) {
      const previousMenu = this.menuStack.pop();
      console.log(`Going back to ${previousMenu}...`);
      this[previousMenu]();
    } else {
      console.log("Cannot go back further. Already at the main menu.");
    }
  }

  mainMenu() {
    let exitRequested = false;

    while (!exitRequested) {
      console.log("Are you an admin or customer?\n1. Admin\n2. Customer\n3. Exit");
      let option = readlineSync.question("Enter the option: ");

      switch (option) {
        case "1":
          this.currentUserType = 'admin';  // Set the currentUserType
          this.adminMenu();
          break;
        case "2":
          this.currentUserType = 'customer';  // Set the currentUserType
          this.customerMenu();
          break;
        case "3":
          console.log("Exiting...");
          exitRequested = true;
          break;
        default:
          console.log("Invalid option. Please enter 1, 2, or 3.");
      }
    }
  }

  customerMenu() {
    let loggedIn = false;

    console.log("Choose the option...\n1. Sign up\n2. Login\n3. Go back");

    let option;
    do {
      option = readlineSync.question('Enter the option you want to choose: ');

      switch (option) {
        case "1":
          this.signup();
          loggedIn = true;
          break;
        case "2":
          this.login();
          loggedIn = true;
          break;
        case "3":
          console.log("Going back...");
          this.currentUserType = '';  
          return;
        default:
          console.log("Invalid option. Please try again.");
      }
    } while (!loggedIn);

    let key_press;

    while (!(key_press === "Q")) {
      console.log(`\n----------Welcome To Library Management System---------\n`);
      console.log(`Press I to Rent Books`);
      console.log(`Press D to Display Books`);
      console.log(`Press R to Return Book`);
      console.log(`Press B to Go Back`);

      key_press = readlineSync.question("Press Key: ").toUpperCase();

      // Push the current menu to the stack
      this.menuStack.push("customerMenu");

      switch (key_press) {
        case "I":
          console.log("\nCurrent Selection: Rent Book\n");
          this.issueBooks();
          break;
        case "A":
          console.log("\nCurrent Selection: Add Book\n");
          this.addBooks();
          break;
        case "D":
          console.log("\nCurrent Selection: Display Books\n");
          this.displayBooks();
          break;
        case "R":
          console.log("\nCurrent Selection: Return Book\n");
          this.returnBooks();
          break;
        case "Q":
          this.writeBooksData();
          break;
        case "B":
          // Call the goBack function
          this.goBack();
          break;
        default:
          console.log("Invalid selection. Please try again.");
      }
    }
  }
}

const librarySystem = new LibraryManagementSystem();

if (require.main === module) {
  try {
    
    librarySystem.initializeBooks("/home/ng/Desktop/libraryproject/list_of_books.txt");
    librarySystem.mainMenu();
  } catch (e) {
    console.log("Something went wrong. Please check. !!!");
  }
}

console.log("Are you an admin or customer?\n1. Admin\n2. Customer\n3.Exit");
let option = readlineSync.question("Enter the option: ");

if (option === "2") {
  console.log('1. Signup');
  console.log('2. Login');
  console.log('3. Exit');
  const choice = readlineSync.question('Enter your choice: ');
  if (choice === "1") {
    librarySystem.signup();
    let key_press = false;
    while (!(key_press === "Q")) {
      console.log(`\n----------Welcome To Library Management System---------\n`);
      console.log(`Press I to RENT Books`);
      console.log(`Press D to Display Books`);
      console.log(`Press R to Return Books`);
      console.log(`Press Q to Quit`);
  
      key_press = readlineSync.question("Press Key : ").toUpperCase();
      switch (key_press) {
        case "I":
          console.log("\nCurrent Selection : RENT BOOK\n");
          librarySystem.issueBooks();
          break;
        case "A":
          console.log("\nCurrent Selection : ADD BOOK\n");
          librarySystem.addBooks();
          break;
        case "D":
          console.log("\nCurrent Selection : DISPLAY BOOKS\n");
          librarySystem.displayBooks();
          break;
        case "R":
          console.log("\nCurrent Selection : RETURN BOOK\n");
          librarySystem.returnBooks();
          break;
        case "Q":
          librarySystem.writeBooksData();
          break;
        default:
          console.log("Invalid selection. Please try again.");
          const retryOption = readlineSync.keyInYNStrict('Do you want to retry?');
          if (!retryOption) {
            console.log('Exiting...');
            process.exit();
        }
      }
    }
  } else if (choice === "2") {
    librarySystem.login();
    let key_press = false;
    while (!(key_press === "Q")) {
      console.log(`\n----------Welcome To Library Management System---------\n`);
      console.log(`Press I to RENT Books`);
      console.log(`Press D to Display Books`);
      console.log(`Press R to Return Books`);
      console.log(`Press Q to Quit`);
      
      key_press = readlineSync.question("Press Key : ").toUpperCase();
      switch (key_press) {
        case "I":
          console.log("\nCurrent Selection : RENT BOOK\n");
          librarySystem.issueBooks();
          break;
        case "A":
          console.log("\nCurrent Selection : ADD BOOK\n");
          librarySystem.addBooks();
          break;
          case "D":
            console.log("\nCurrent Selection : DISPLAY BOOKS\n");
            librarySystem.displayBooks();
            break;
            case "R":
              console.log("\nCurrent Selection : RETURN BOOK\n");
              librarySystem.returnBooks();
              break;
        case "Q":
          librarySystem.writeBooksData();
          break;
          default:
          console.log("Invalid selection. Please try again.");
          const retryOption = readlineSync.keyInYNStrict('Do you want to retry?');
        if (!retryOption) {
          console.log('Exiting...');
          process.exit();
        }
      }
    }
  } else if (choice === "3") {
    console.log("Exiting...");
  } else {
    console.log("Invalid choice. Please enter 1, 2, or 3");
  }
} else if (option === "1") {
  console.log("Admin functionality (to be implemented)");
  if (!librarySystem.authenticate()) {
    return;
  }
  librarySystem.runLibraryManagementSystem("list_of_books.txt", "library_name");
}else if(option==="3"){
  console.log("EXiting...")
} else {
  console.log("Invalid option. Please enter 1 or 2.");
}