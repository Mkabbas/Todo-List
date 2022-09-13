const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
mongoose.connect("mongodb+srv://admin-kazim:test123@cluster0.rkx7a2k.mongodb.net/?retryWrites=true&w=majority");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);

const task1 = new Item({
  name: "Wake up"
});
const task2 = new Item({
  name: "Eat"
});
const task3 = new Item({
  name: "Sleep"
});
const defaultItems = [task1, task2, task3];

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  
  Item.find(function(err, list) {
    if (err) {
      console.log(err);
    } else {
      if (list.length == 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully savevd default items to DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: list});
      }
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  })

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, list) {
      list.items.push(item);
      list.save();
    })
    res.redirect("/" + listName);
  }
});

app.post("/delete", function(req,res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Deleted.")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}},  function(err, list) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
})

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, list) {
    if (!err) {
      if (!list){
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: customListName, newListItems: list.items});
      }
    } else {
      console.log(err);
    }
  })
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
