var mysql = require('mysql');
var inquire = require('inquirer');
var connection = mysql.createConnection({
    host:'localhost',
    port:'8889',
    user: 'root',
    password: 'root',
    database: 'bamazon_db'    
})

var id_array=[];

var manager = {
    read: function(){
        id_array = [];
        connection.query('select item_id from products',function(err,res){
            if (err) throw err;
            else{       
                for (i=0;i<res.length;i++){
                    id_array.push(res[i].item_id);
                };
                manager.prompt();
            }
        });
    },
    prompt: function(){
        inquire.prompt([
            {
                type: 'list',
                message: 'Select an Action:',
                choices: ['View products for sale.','View low inventory.','Add to inventory.','Add new product.','Exit.'],
                name: 'action'
            }
        ]).then(function(res){
            switch (res.action){
                case 'View products for sale.':
                    manager.view();
                    break;
                case 'View low inventory.':
                    manager.viewLow();
                    break;
                case 'Add to inventory.':
                    manager.addInventory();
                    break;
                case 'Add new product.':
                    manager.addProduct();
                    break;
                case 'Exit.':
                    connection.end();
                default:
                    break;
            };
        })
    },
    view: function(){
        for (id in id_array){
            connection.query('select * from products where item_id =' + id_array[id],function(error,result){
                if (error) throw error;
                else{
                    console.log(result[0].item_id + 
                        ' | '  + 
                        result[0].product_name + 
                        ' | $' + 
                        result[0].price + 
                        ' | ' +
                        result[0].stock_quantity
                    );
                    if(result[0].item_id === id_array[id_array.length - 1]){
                        manager.read();
                    }
                }
            });              
        } 
    },
    viewLow: function(){
        for (id in id_array){
            connection.query('select * from products where item_id =' + id_array[id],function(error,result){
                if (error) throw error;
                else{
                    if (result[0].stock_quantity <= 5){
                        console.log(result[0].item_id + 
                            ' | '  + 
                            result[0].product_name + 
                            ' | $' + 
                            result[0].price + 
                            ' | ' +
                            result[0].stock_quantity
                        );
                    }
                    if(result[0].item_id === id_array[id_array.length - 1]){
                        manager.read();
                    }
                }
            });              
        } 
    },
    addInventory: function(){
        inquire.prompt([
            {
                name:'product_id',
                message:'Enter the ID of the item you would like to add inventory to:',
                validate: function(answer){
                    if (id_array.indexOf(parseInt(answer))=== -1){
                        return false;
                    }
                    else{
                        return true;
                    }
                }
            },
            {
                name:'product_quantity',
                message: 'Enter the amount of inventory you would like to add:',
                validate: function(answer){
                    if(isNaN(answer)|| answer < 0){
                        return false;
                    }
                    else{
                        return true;
                    }
                }
            }
        ]).then(function(res){
             manager.updateStock(res.product_id,res.product_quantity);                
        });
    },
    updateStock: function(id,value){
        connection.query('update products set stock_quantity = stock_quantity + ' + parseInt(value) + ' where ?',
        {
            item_id: id
        },
        function(err,res){
            if (err) throw err;
            else{
                console.log('Success.')
            };
            manager.read();
        });
    },
    addProduct: function(){
        inquire.prompt([
            {
                name:'productname',
                message: 'Name of the product you would like to add:',
                validate: function(answer){
                    if (answer.trim() === ''){
                        return false;
                    }else{
                        return true;
                    }
                }
            },
            {
                name:'departmentname',
                message: 'Category of the product:',
                validate: function(answer){
                    if (answer.trim() === ''){
                        return false;
                    }else{
                        return true;
                    }
                }
            },
            {
                name: 'productprice',
                message: 'Price of product:',
                validate: function(answer){
                    if (isNaN(answer) || parseInt(answer) <= 0){
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            {
                name: 'productquantity',
                message: 'Stock quantity:',
                validate: function(answer){
                    if (isNaN(answer) || parseInt(answer) <= 0){
                        return false;
                    } else {
                        return true;
                    }                    
                }
            }
        ]).then(function(res){
            connection.query('insert into products SET ?',
            {
               product_name: res.productname,
               department_name: res.departmentname,
               price: res.productprice,
               stock_quantity: res.productquantity
            },function(err,results){
                if (err) throw err;
                else{
                    console.log('Sucess. New product added: ' + res.productname);
                    manager.read();
                }
            })
        })

    }
}

// connection.query('select item_id from products',function(err,res){
//     if (err) throw err;
//     else{       
//         for (i=1;i<res.length+1;i++){
//             id_array.push(i);
//         }
//         manager.prompt();
//     }
// });

manager.read();