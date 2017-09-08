var mysql = require('mysql');
var inquire = require('inquirer');

var id_array = [];
var receipt = [];
var connection = mysql.createConnection({
    host:'localhost',
    port:'8889',
    user: 'root',
    password: 'root',
    database: 'bamazon_db'    
})

var customer = {
    read: function(){
        id_array = [];
        connection.query('select item_id from products',function(err,res){
            if (err) throw err;
            else{       
                for (i=0;i<res.length;i++){
                    id_array.push(res[i].item_id);
                };
                customer.display();
            }
        });
    },
    display: function(){
        for (id in id_array){
            connection.query('select * from products where item_id =' + id_array[id],function(error,result){
                if (error) throw error;
                else{
                    console.log(result[0].item_id + 
                        ' | '  + 
                        result[0].product_name + 
                        ' | $' + 
                        result[0].price
                    );
                    if(result[0].item_id === id_array[id_array.length - 1]){
                        customer.purchase();
                    }
                }
            });              
        } 

    },
    purchase: function(){
        inquire.prompt([
            {
                name:'selection_id',
                message: 'Please enter the ID number of the product you would like to purchase.',
                validate: function(identifier){
                    if (id_array.indexOf(parseInt(identifier)) === -1){
                        return false;
                    } else{
                        return true;
                    }
                }
            }
        ]).then(function(result){
            customer.quantity(result.selection_id);
        });        
    },
    quantity: function(product_id){
        connection.query('select product_name from products where item_id=' + product_id,function(error,result){
            if (error) throw error;
            else{
                var name = result[0].product_name;
                inquire.prompt([
                    {
                        name:'quantity',
                        message: 'Quantity of ' + name + '(s) to be purchased?',
                        validate: function(answer){
                            if (isNaN(answer) || answer < 0){
                                return false;
                            }else{
                                return true;
                            }
                        }
                    }
                ]).then(function(res){
                    customer.checkQuantity(res.quantity,product_id,name);
                });
            }
        });
    },
    checkQuantity: function(value,id,name){
        connection.query('select stock_quantity from products where item_id='+id,function(err,res){
            if (err) throw err;
            else{
                if (res[0].stock_quantity < value){
                    console.log('Insuffecient Quanitity. There are only ' + res[0].stock_quantity + ' available.');
                    customer.quantity(id);
                }
                else{
                    customer.updateStock(res[0].stock_quantity,value,id,name);
                }
            };
        });
    },
    updateStock: function(old_stock,order_amount,id,name){
        let new_stock = old_stock - order_amount;
        connection.query('update products set ? where ?',
        [
            {
                stock_quantity: new_stock
            },
            {
                item_id: id
            }
        ],
        function(err,res){
            if (err) throw err;
            else{
                connection.query('select price from products where item_id='+id, function(err,res){
                    if (err) throw err;
                    else{
                        let price = res[0].price * order_amount;
                        console.log('Congratulations! You ordered ' + order_amount + ' ' + name + '(s) for $' + res[0].price + ' each. The total cost is $' + price);
                        receipt.push(name);
                        receipt.push(price);
                        customer.prompt();
                    };        
                });
            };
        }
        );        
    },
    prompt: function(){
        inquire.prompt([
            {
                type:'list',
                name:'answer',
                message:'What would you like to do next?',
                choices:['Purchase another product','Done']
            }
        ]).then(function(res){
            if (res.answer === 'Purchase another product'){
                customer.read();
            }
            else{
                console.log(receipt);
                for (item in receipt){
                    console.log('Total purchase: \n' + receipt[item] + ':$' + receipt[item])
                }
                connection.end();
            }
        })
    }
}

customer.read();



