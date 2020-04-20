//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');
const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(ignoreFavicon);

mongoose.connect('mongodb+srv://admin-hashim:TestDB123@cluster0-agiei.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item',itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todo list'
});

const item2 = new Item({
  name: 'Hit the + button to add a new item'
});

const item3 = new Item({
  name: '<-- hit this to delete an item'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema);

app.get("/", function(req, res) {

  Item.find(function (err, foundItems) {

      if(foundItems.length === 0) {
        
        Item.insertMany(defaultItems, function (err) {
          if(err) {
            console.log(err);

          }
          else {
            console.log('successfully added items to DB');

          }
        });

        res.redirect('/');

      } else {
        res.render("list", {listTitle: 'Today', newListItems: foundItems });
      }
     
  });
});

app.get('/:customListNames', function (req, res) {
  const customListNames = _.capitalize(req.params.customListNames);

  List.findOne({name: customListNames}, function(err,foundlist) {
    if(err) {
      console.log(err);
      
    }
    else if(foundlist) {
      //if found list show it
      res.render('list', {listTitle: foundlist.name, newListItems: foundlist.items})
      
    }
    else {
      //if not found create it
      const list = new List({
        name: customListNames,
        items: defaultItems
      });
      list.save();
      res.redirect('/'+ customListNames);
    }
  });

});

function ignoreFavicon(req, res, next) {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({
      nope: true
    });
  } else {
    next();
  }
}

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });

  if (listName == "Today") {
    item.save();
    res.redirect('/');
    
  }
  else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/'+listName);
    });
    
  }

});

app.post('/delete', function(req,res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  
  if ( listName == "Today") {
    Item.findOneAndRemove({ _id: checkedItemId}, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('removed the item');
        res.redirect('/');
      }

    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList) {
      if (!err) {
        res.redirect('/'+ listName);
      }
    } );
  }

  
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
