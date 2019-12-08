var LambdaLang = function(outf){
    var actionType = {
        shift:function(d){
            return {type:"shift",v:d};
            },
        reduce:function(d){
            return {type:"reduce",v:d};
            },
        accept:function(d){
            return {type:"accept",v:null};
            },
        error:function(msg){
            return {type:"error",v:msg};
            },
        none:function(){
            return {type:"none",v:null};
            },
        some:function(v){
            return {type:"some",v:v}
            }
        };
    var isSome = function(m){
        return m.t === "some";
        };
    var isNone = function(m){
        return m.t === "none";
        };
    var _token = function(m,o){
        //m.tv = token val
        //m.t = some/none
        //m.v = value if some, else null
        if(o[m.tt] !== undefined){
            return o[m.tt](m.tt,m.tv);
            }
        };
    /* Add tokens to the tree here.
     * That is: Change Me!
     */
    var addToken2tree = function(tree,node){
        _token(node,{
            "var":function(tokenType,tokenVal){
                tree.push({type:"var",v:tokenVal});
                }
           });
        return tree;
        };
    var errors = {
        syntax:function(pos,msg){
            return "syntax error at (" + pos.y + "," + pos.x + "):" + msg;
            },
        garbage:function(g){
            return "garbage in expression: '" + g + "'";
            }
        };
    /* Change Me! Create the abstract syntax tree here */
    var productions_fun = {
        //[0] __ -> Stmt 
        0:function(tree){ return tree; },
        //[1] Stmt -> Term0 
        1:function(tree){
            var term = tree.pop();
            var stmts = tree.pop();
            stmts.args.push(term);
            tree.push(stmts);
            return tree;
            },
        //[2] Stmt -> Def scolon Stmt 
        2:function(tree){
            return tree;
            },
        //[3] Def -> let var eq Term0 
        3:function(tree){
            var term = tree.pop();
            var id = tree.pop();
            var stmts = tree.pop();
            stmts.args.push({type:"binding",id:id.v,term:term});
            tree.push(stmts);
            return tree;
            },
        //[4] Term0 -> Term1 
        4:function(tree){ return tree; },
        //[5] Term0 -> lambda var dot Term0 
        5:function(tree){
            var body = tree.pop();
            var binder = tree.pop();
            tree.push({type:"abstraction",binder:binder,body:body});
            return tree;
            },
        //[6] Term1 -> Term2 
        6:function(tree){ return tree; },
        //[7] Term1 -> Term1 Term2 
        7:function(tree){
            var arg = tree.pop();
            var fun = tree.pop();
            tree.push({type:"apply",arg:arg,fun:fun});
            return tree;
            },
        //[8] Term2 -> lpar Term0 rpar 
        8:function(tree){ return tree; },
        //[9] Term2 -> var 
        9:function(tree){ return tree; }
        };
    var productions_str = {
        0:{prod:"__",rside:[ "Stmt"]},
        1:{prod:"Stmt",rside:[ "Term0"]},
        2:{prod:"Stmt",rside:[ "Def","scolon","Stmt"]},
        3:{prod:"Def",rside:[ "let","var","eq","Term0"]},
        4:{prod:"Term0",rside:[ "Term1"]},
        5:{prod:"Term0",rside:[ "lambda","var","dot","Term0"]},
        6:{prod:"Term1",rside:[ "Term2"]},
        7:{prod:"Term1",rside:[ "Term1","Term2"]},
        8:{prod:"Term2",rside:[ "lpar","Term0","rpar"]},
        9:{prod:"Term2",rside:[ "var"]}
        };
    var lexer = function(inStr){
        var rxStr =
            "(=)|"+
            "(\\\\)|"+
            "(\\.)|"+
            "(\\()|"+
            "(\\))|"+
            "(;)|"+
            "(let)|"+
            "([a-zA-Z0-9_\\-]+)|"+
            "\\/\\/[^\\n]*|"+
            " +|\\n+";
        var rx = new RegExp(rxStr,"g");
        var retI = 0;
        var retval = {};
        var linepos = {lnr:1,start:0};
        var resStr = inStr.replace(rx,
            function(a,i1,i2,i3,i4,i5,i6,i7,i8,posX){
                linepos.x = posX;
                if(a === "\n"){
                    linepos.lnr++;
                    linepos.start = posX;
                    }
                if(typeof i1 !== "undefined"){
                    retval[retI] = {t:"none",tt:"eq",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i2 !== "undefined"){
                    retval[retI] = {t:"none",tt:"lambda",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i3 !== "undefined"){
                    retval[retI] = {t:"none",tt:"dot",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i4 !== "undefined"){
                    retval[retI] = {t:"none",tt:"lpar",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i5 !== "undefined"){
                    retval[retI] = {t:"none",tt:"rpar",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i6 !== "undefined"){
                    retval[retI] = {t:"none",tt:"scolon",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i7 !== "undefined"){
                    retval[retI] = {t:"none",tt:"let",tv:null,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                else if(typeof i8 !== "undefined"){
                    retval[retI] = {t:"some",tt:"var",tv:i8,posX:posX - linepos.start,posY:linepos.lnr};
                    retI++;
                    }
                return "";
                }
            );
        if(resStr !== ""){
            retval["__success"] = false;
            retval["__res"] = resStr;
            }
        else {
            retval[retI] = {t:"none",v:null,tt:"$",tv:null,posX:linepos.x - linepos.start,posY:linepos.lnr};
            }
        return retval;
        };
    var actionTable = {
        0:{
            "eq":actionType.error("expected 'lambda','let','lpar','var', but given 'eq'"),
            "lambda":actionType.shift(6),
            "dot":actionType.error("expected 'lambda','let','lpar','var', but given 'dot'"),
            "lpar":actionType.shift(8),
            "rpar":actionType.error("expected 'lambda','let','lpar','var', but given 'rpar'"),
            "scolon":actionType.error("expected 'lambda','let','lpar','var', but given 'scolon'"),
            "let":actionType.shift(7),
            "var":actionType.shift(9),
            "$":actionType.error("expected 'lambda','let','lpar','var', but given '$'")
            },
        1:{
            "eq":actionType.error("expected 'scolon', but given 'eq'"),
            "lambda":actionType.error("expected 'scolon', but given 'lambda'"),
            "dot":actionType.error("expected 'scolon', but given 'dot'"),
            "lpar":actionType.error("expected 'scolon', but given 'lpar'"),
            "rpar":actionType.error("expected 'scolon', but given 'rpar'"),
            "scolon":actionType.shift(10),
            "let":actionType.error("expected 'scolon', but given 'let'"),
            "var":actionType.error("expected 'scolon', but given 'var'"),
            "$":actionType.error("expected 'scolon', but given '$'")
            },
        2:{
            "eq":actionType.error("expected 'eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'eoi', but given 'dot'"),
            "lpar":actionType.error("expected 'eoi', but given 'lpar'"),
            "rpar":actionType.error("expected 'eoi', but given 'rpar'"),
            "scolon":actionType.error("expected 'eoi', but given 'scolon'"),
            "let":actionType.error("expected 'eoi', but given 'let'"),
            "var":actionType.error("expected 'eoi', but given 'var'"),
            "$":actionType.accept()
            },
        3:{
            "eq":actionType.error("expected 'eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'eoi', but given 'dot'"),
            "lpar":actionType.error("expected 'eoi', but given 'lpar'"),
            "rpar":actionType.error("expected 'eoi', but given 'rpar'"),
            "scolon":actionType.error("expected 'eoi', but given 'scolon'"),
            "let":actionType.error("expected 'eoi', but given 'let'"),
            "var":actionType.error("expected 'eoi', but given 'var'"),
            "$":actionType.reduce(1)
            },
        4:{
            "eq":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'dot'"),
            "lpar":actionType.shift(8),
            "rpar":actionType.reduce(4),
            "scolon":actionType.reduce(4),
            "let":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'let'"),
            "var":actionType.shift(9),
            "$":actionType.reduce(4)
            },
        5:{
            "eq":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'dot'"),
            "lpar":actionType.reduce(6),
            "rpar":actionType.reduce(6),
            "scolon":actionType.reduce(6),
            "let":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'let'"),
            "var":actionType.reduce(6),
            "$":actionType.reduce(6)
            },
        6:{
            "eq":actionType.error("expected 'var', but given 'eq'"),
            "lambda":actionType.error("expected 'var', but given 'lambda'"),
            "dot":actionType.error("expected 'var', but given 'dot'"),
            "lpar":actionType.error("expected 'var', but given 'lpar'"),
            "rpar":actionType.error("expected 'var', but given 'rpar'"),
            "scolon":actionType.error("expected 'var', but given 'scolon'"),
            "let":actionType.error("expected 'var', but given 'let'"),
            "var":actionType.shift(12),
            "$":actionType.error("expected 'var', but given '$'")
            },
        7:{
            "eq":actionType.error("expected 'var', but given 'eq'"),
            "lambda":actionType.error("expected 'var', but given 'lambda'"),
            "dot":actionType.error("expected 'var', but given 'dot'"),
            "lpar":actionType.error("expected 'var', but given 'lpar'"),
            "rpar":actionType.error("expected 'var', but given 'rpar'"),
            "scolon":actionType.error("expected 'var', but given 'scolon'"),
            "let":actionType.error("expected 'var', but given 'let'"),
            "var":actionType.shift(13),
            "$":actionType.error("expected 'var', but given '$'")
            },
        8:{
            "eq":actionType.error("expected 'lambda','lpar','var', but given 'eq'"),
            "lambda":actionType.shift(6),
            "dot":actionType.error("expected 'lambda','lpar','var', but given 'dot'"),
            "lpar":actionType.shift(8),
            "rpar":actionType.error("expected 'lambda','lpar','var', but given 'rpar'"),
            "scolon":actionType.error("expected 'lambda','lpar','var', but given 'scolon'"),
            "let":actionType.error("expected 'lambda','lpar','var', but given 'let'"),
            "var":actionType.shift(9),
            "$":actionType.error("expected 'lambda','lpar','var', but given '$'")
            },
        9:{
            "eq":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'dot'"),
            "lpar":actionType.reduce(9),
            "rpar":actionType.reduce(9),
            "scolon":actionType.reduce(9),
            "let":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'let'"),
            "var":actionType.reduce(9),
            "$":actionType.reduce(9)
            },
        10:{
            "eq":actionType.error("expected 'lambda','let','lpar','var', but given 'eq'"),
            "lambda":actionType.shift(6),
            "dot":actionType.error("expected 'lambda','let','lpar','var', but given 'dot'"),
            "lpar":actionType.shift(8),
            "rpar":actionType.error("expected 'lambda','let','lpar','var', but given 'rpar'"),
            "scolon":actionType.error("expected 'lambda','let','lpar','var', but given 'scolon'"),
            "let":actionType.shift(7),
            "var":actionType.shift(9),
            "$":actionType.error("expected 'lambda','let','lpar','var', but given '$'")
            },
        11:{
            "eq":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'dot'"),
            "lpar":actionType.reduce(7),
            "rpar":actionType.reduce(7),
            "scolon":actionType.reduce(7),
            "let":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'let'"),
            "var":actionType.reduce(7),
            "$":actionType.reduce(7)
            },
        12:{
            "eq":actionType.error("expected 'dot', but given 'eq'"),
            "lambda":actionType.error("expected 'dot', but given 'lambda'"),
            "dot":actionType.shift(16),
            "lpar":actionType.error("expected 'dot', but given 'lpar'"),
            "rpar":actionType.error("expected 'dot', but given 'rpar'"),
            "scolon":actionType.error("expected 'dot', but given 'scolon'"),
            "let":actionType.error("expected 'dot', but given 'let'"),
            "var":actionType.error("expected 'dot', but given 'var'"),
            "$":actionType.error("expected 'dot', but given '$'")
            },
        13:{
            "eq":actionType.shift(17),
            "lambda":actionType.error("expected 'eq', but given 'lambda'"),
            "dot":actionType.error("expected 'eq', but given 'dot'"),
            "lpar":actionType.error("expected 'eq', but given 'lpar'"),
            "rpar":actionType.error("expected 'eq', but given 'rpar'"),
            "scolon":actionType.error("expected 'eq', but given 'scolon'"),
            "let":actionType.error("expected 'eq', but given 'let'"),
            "var":actionType.error("expected 'eq', but given 'var'"),
            "$":actionType.error("expected 'eq', but given '$'")
            },
        14:{
            "eq":actionType.error("expected 'rpar', but given 'eq'"),
            "lambda":actionType.error("expected 'rpar', but given 'lambda'"),
            "dot":actionType.error("expected 'rpar', but given 'dot'"),
            "lpar":actionType.error("expected 'rpar', but given 'lpar'"),
            "rpar":actionType.shift(18),
            "scolon":actionType.error("expected 'rpar', but given 'scolon'"),
            "let":actionType.error("expected 'rpar', but given 'let'"),
            "var":actionType.error("expected 'rpar', but given 'var'"),
            "$":actionType.error("expected 'rpar', but given '$'")
            },
        15:{
            "eq":actionType.error("expected 'eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'eoi', but given 'dot'"),
            "lpar":actionType.error("expected 'eoi', but given 'lpar'"),
            "rpar":actionType.error("expected 'eoi', but given 'rpar'"),
            "scolon":actionType.error("expected 'eoi', but given 'scolon'"),
            "let":actionType.error("expected 'eoi', but given 'let'"),
            "var":actionType.error("expected 'eoi', but given 'var'"),
            "$":actionType.reduce(2)
            },
        16:{
            "eq":actionType.error("expected 'lambda','lpar','var', but given 'eq'"),
            "lambda":actionType.shift(6),
            "dot":actionType.error("expected 'lambda','lpar','var', but given 'dot'"),
            "lpar":actionType.shift(8),
            "rpar":actionType.error("expected 'lambda','lpar','var', but given 'rpar'"),
            "scolon":actionType.error("expected 'lambda','lpar','var', but given 'scolon'"),
            "let":actionType.error("expected 'lambda','lpar','var', but given 'let'"),
            "var":actionType.shift(9),
            "$":actionType.error("expected 'lambda','lpar','var', but given '$'")
            },
        17:{
            "eq":actionType.error("expected 'lambda','lpar','var', but given 'eq'"),
            "lambda":actionType.shift(6),
            "dot":actionType.error("expected 'lambda','lpar','var', but given 'dot'"),
            "lpar":actionType.shift(8),
            "rpar":actionType.error("expected 'lambda','lpar','var', but given 'rpar'"),
            "scolon":actionType.error("expected 'lambda','lpar','var', but given 'scolon'"),
            "let":actionType.error("expected 'lambda','lpar','var', but given 'let'"),
            "var":actionType.shift(9),
            "$":actionType.error("expected 'lambda','lpar','var', but given '$'")
            },
        18:{
            "eq":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'dot'"),
            "lpar":actionType.reduce(8),
            "rpar":actionType.reduce(8),
            "scolon":actionType.reduce(8),
            "let":actionType.error("expected 'lpar','rpar','scolon','var','eoi', but given 'let'"),
            "var":actionType.reduce(8),
            "$":actionType.reduce(8)
            },
        19:{
            "eq":actionType.error("expected 'rpar','scolon','eoi', but given 'eq'"),
            "lambda":actionType.error("expected 'rpar','scolon','eoi', but given 'lambda'"),
            "dot":actionType.error("expected 'rpar','scolon','eoi', but given 'dot'"),
            "lpar":actionType.error("expected 'rpar','scolon','eoi', but given 'lpar'"),
            "rpar":actionType.reduce(5),
            "scolon":actionType.reduce(5),
            "let":actionType.error("expected 'rpar','scolon','eoi', but given 'let'"),
            "var":actionType.error("expected 'rpar','scolon','eoi', but given 'var'"),
            "$":actionType.reduce(5)
            },
        20:{
            "eq":actionType.error("expected 'scolon', but given 'eq'"),
            "lambda":actionType.error("expected 'scolon', but given 'lambda'"),
            "dot":actionType.error("expected 'scolon', but given 'dot'"),
            "lpar":actionType.error("expected 'scolon', but given 'lpar'"),
            "rpar":actionType.error("expected 'scolon', but given 'rpar'"),
            "scolon":actionType.reduce(3),
            "let":actionType.error("expected 'scolon', but given 'let'"),
            "var":actionType.error("expected 'scolon', but given 'var'"),
            "$":actionType.error("expected 'scolon', but given '$'")
            }
        };
    var gotoTable = {
        0:{
            "Stmt":actionType.some(2),
            "Def":actionType.some(1),
            "Term0":actionType.some(3),
            "Term1":actionType.some(4),
            "Term2":actionType.some(5)
            },
        1:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        2:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        3:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        4:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.some(11)
            },
        5:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        6:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        7:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        8:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.some(14),
            "Term1":actionType.some(4),
            "Term2":actionType.some(5)
            },
        9:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        10:{
            "Stmt":actionType.some(15),
            "Def":actionType.some(1),
            "Term0":actionType.some(3),
            "Term1":actionType.some(4),
            "Term2":actionType.some(5)
            },
        11:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        12:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        13:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        14:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        15:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        16:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.some(19),
            "Term1":actionType.some(4),
            "Term2":actionType.some(5)
            },
        17:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.some(20),
            "Term1":actionType.some(4),
            "Term2":actionType.some(5)
            },
        18:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        19:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            },
        20:{
            "Stmt":actionType.none(),
            "Def":actionType.none(),
            "Term0":actionType.none(),
            "Term1":actionType.none(),
            "Term2":actionType.none()
            }
        };
    var parser = function(tokens){
        var sStack = new Stack();
        var tree = new Stack();
        var i = 0;
        var parsing = true;
        if(tokens["__success"] !== undefined && !tokens["__success"]){
            tree.push({error:true,msg:errors.garbage(tokens["__res"])});
            return tree;
            }
        sStack.push(0);
        tree.push({type:"stmts",args:[]});
        while(parsing){
            var s = sStack.peek();
            var a = tokens[i].tt;
            var entry = actionTable[s][a];
            switch(entry.type){
                case "shift":
                    sStack.push(entry.v);
                    tree = addToken2tree(tree,tokens[i]);
                    i += 1;
                    break;
                case "reduce":
                    var r = entry.v;
                    var prod = productions_str[r];
                    var rSide = prod.rside;
                    var pName = prod.prod;
                    var pFun = productions_fun[r];
                    sStack.popN(rSide.length,function(x){});
                    sStack.push(gotoTable[sStack.peek()][pName].v);
                    tree = pFun(tree);
                    break;
                case "accept":
                    return tree;
                case "error":
                    var token = tokens[i];
                    tree.push({error:true,msg:errors.syntax({x:token.posX,y:token.posY},entry.v)});
                    return tree;
                }
            }
        };
    /* End of parser and generated code
     * Start of print and eval
     * */
    var assignPtrsToTree = function(tree){
        // de brunji style variables
        // Instead of db approach, each binder
        // has a unique addr. Vars that are free
        // have a null ptr, the rest have a ptr to
        // the inner most binder. We can do this since
        // scope and closures are static. Note that
        // though the ptr is constant, the value behind
        // can change, eg. between
        // (\ s . s) a
        // and
        // (\ s . s) b
        var addr = 1;
        var ptrs = { /* binder -> addr */ };
        var travTerm = function(term){
            switch(term.type){
                case "abstraction":
                    // type,binder,body
                    var b = term.binder.v;
                    var oldVal = ptrs[b] === undefined ? null : ptrs[b];
                    ptrs[b] = addr;
                    term.binder.addr = addr;
                    addr++;
                    travTerm(term.body);
                    ptrs[b] = oldVal;
                    break;
                case "apply":
                    // type,arg,fun
                    travTerm(term.arg);
                    travTerm(term.fun);
                    break;
                case "var":
                    var v = term.v;
                    term.ptr = ptrs[v] || null;
                    break;
                default:
                    // can't happen, or we don't care
                    break;
                }
            };
        for(var i = 0; i < tree.args.length; i++){
            var stmt = tree.args[i];
            switch(stmt.type){
                case "binding":
                    // type,id,term
                    stmt.addr = addr;
                    addr++;
                    travTerm(stmt.term);
                    ptrs[stmt.id] = stmt.addr;
                    break;
                default:
                    travTerm(stmt);
                    break;
                }
            }
        return tree;
        };
    var newTree = function(input){
        // Create a new absyn-tree
        // That is the whole process
        // including error handling
        // and so on.
        var lexed = lexer(input);
        var parsed = parser(lexed);
        var t = parsed.pop();
        if(t.error){
            return {error:true,msg:t.msg,stmts:null};
            }
        if(parsed.count() > 0){
            outf("error","not empty absyn-stack");
            }
        return {error:false,msg:"",stmts:assignPtrsToTree(t)};
        };
    var printSpaces = function(n){
        var retval = "";
        for(var i = 0; i < n; i++){
            retval += "<font color='#A4A4A4'>&#9478;</font> ";
            }
        return retval;
        };
    var printLexed = function(l){
        var i = 0;
        while(l[i] !== undefined){
            outf("token",l[i].tt);
            i++;
            }
        };
    var printTree = function(t0){
        var exec = function(depth,t){
            switch(t.type){
                case "var":
                    outf("tnode",printSpaces(depth)+"var."+t.v+"["+t.ptr+"]");
                    break;
                case "abstraction":
                    outf("tnode",printSpaces(depth)+"&lambda;"+t.binder.v+"["+t.binder.addr+"]"+".");
                    exec(depth+1,t.body);
                    break;
                case "apply":
                    outf("tnode",printSpaces(depth)+"apply");
                    exec(depth+1,t.fun);
                    exec(depth+1,t.arg);
                    break;
                }
            };
        exec(0,t0);
        };
    var tree2str = function(tree){
        var str = "";
        var addParsIf = function(cont,check,atype){
            var l = atype[0];
            var r = atype[1];
            if(check){
                str += l;
                }
            cont();
            if(check){
                str += r;
                }
            };
        var exec = function(t){
            switch(t.type){
                case "var":
                    str += t.v;
                    break;
                case "abstraction":
                    str += "&lambda;";
                    str += t.binder.v;
                    str += ". ";
                    exec(t.body);
                    break;
                case "apply":
                    str += "{";
                    addParsIf(function(){exec(t.fun)},isAbstr(t.fun),"[]");
                    str += " ";
                    addParsIf(function(){exec(t.arg)},isAbstr(t.arg),"()");
                    str += "}";
                    break;
                }
            };
        if(tree === null){
            return "null-tree";
            }
        exec(tree);
        return str;
        };
    var treeAppendApps = function(apps,tree){
        // append those apps that are still
        // present in apps-stack
        if(apps.count() === 0){
            return tree;
            }
        var arg = apps.pop();
        return treeAppendApps(apps,{type:"apply",arg:arg,fun:tree});
        };
    var Scope = function(){
        // Scope is one big table of addr -> tree
        // assignPtrsToTree analysis checks whether
        // scope rules are in order
        var pub = {};
        var nameMap = { /* var-name -> addr */ };
        var scope = { /* addr -> tree */ };
        pub.existsAddr = function(addr){
            return scope[addr] !== undefined && scope[addr] !== null;
            };
        pub.setFromAddr = function(addr,tree){
            scope[addr] = JSON.stringify(tree);
            };
        pub.getFromAddr = function(addr){
            var v = scope[addr];
            if(v === undefined || v === null){
                return null;
                }
            return JSON.parse(v);
            };
        pub.setFromName = function(vname,addr){
            nameMap[vname] = addr;
            };
        pub.getFromName = function(vname){  
            return nameMap[vname] || null;
            };
        pub.toString = function(closure){
            return "";
            };
        return pub;
        };
    // Predicate helper functions
    var isAbstr = function(v){
        return v.type === "abstraction";
        };
    var isApp = function(v){
        return v.type === "apply";
        };
    var isVar = function(v){
        return v.type === "var";
        };
    var recCounts = {
        defs:0,
        term:0,
        apps:0,
        vars:0,
        abstrs:0
        };
    var evalAbstr = function(expr,scope){
        // Sub all vars that are in scope
        // Recursively reduce body of abstraction
        if(isAbstr(expr)){
            var appStack = new Stack();
            var body = evalExpr(expr.body,scope,appStack);
            
            // fix creates infin rec. This might have to do
            // with eager evaluation in this version of lcalc

            body = treeAppendApps(appStack,body);
            return {type:expr.type,binder:expr.binder,body:body};
            }
        return expr;
        };
    var evalExpr = function(expr,scope,appStack){
        switch(expr.type){
            case "apply":
                // type,arg,fun
                var arg = function(){
                    // Eval arg first (eager exec) - depth first
                    // Eval arg with new stack to avoid mix up
                    var appStack0 = new Stack();
                    var argVal = evalExpr(expr.arg,scope,appStack0);
                    var retval = treeAppendApps(appStack0,argVal);
                    return retval;
                    }();
                var body = function(){
                    // keep on evaluating adding to appStack
                    appStack.push(arg);
                    return evalExpr(expr.fun,scope,appStack);
                    }();
                if(isVar(body)){
                    // Final term is var
                    // Add apps to this
                    return treeAppendApps(appStack,body);
                    }
                return body;
            case "abstraction":
                // type,binder,body
                var topArg = appStack.pop();
                if(topArg === null){
                    // Final return is abstr.
                    // Sub vars that are in scope
                    return evalAbstr(expr,scope);
                    }
                var bName = expr.binder.v;
                var bAddr = expr.binder.addr;
                var oldScopeAddr = scope.getFromName(bName);
                var oldScopeVal = scope.getFromAddr(bAddr);
                scope.setFromAddr(bAddr,topArg);
                scope.setFromName(bName,bAddr);
                var retval = evalExpr(expr.body,scope,appStack);
                scope.setFromName(bName,oldScopeAddr);
                scope.setFromAddr(bAddr,oldScopeVal);
                return retval;
            case "var":
                // Do substitution here
                // type,v,ptr
                var res = scope.getFromAddr(expr.ptr);
                if(res === null){
                    return expr;
                    }
                if(isAbstr(res)){
                    // Keep on evaluating the abstraction
                    // Use empty scope
                    return evalExpr(res,new Scope(),appStack);
                    }
                return res;
            default:
                // we don't care about rest
                return expr;
            }
        };
    var evalStmts = function(stmts){
        var scope = new Scope();
        var res;
        for(var i = 0; i < stmts.length; i++){
            var stmt = stmts[i];
            switch(stmt.type){
                case "binding":
                    //type,id,termkey,addr
                    scope.setFromName(stmt.id,stmt.addr);
                    scope.setFromAddr(stmt.addr,evalExpr(stmt.term,scope,new Stack()));
                    break;
                default:
                    res = evalExpr(stmt,scope,new Stack());
                    break;
                }
            }
        printfn("","res:");
        printfn("",tree2str(res))
        printfn("","");
        };
    var evalTree = function(tree){
        evalStmts(tree.stmts.args);
        outf("env","[]");
        outf("res","none");
        };
    return {
        evalPrg:function(input){
            var tree = newTree(input);
            if(tree.error){
                outf("error",tree.msg);
                return false;
                }
            evalTree(tree);
            return true;
            },
        printTree:function(input){
            var tree = newTree(input);
            if(tree.error){
                outf("error",tree.msg);
                return false;
                }
            printTree(tree.stmts.args[tree.stmts.args.length - 1]);
            return true;
            },
        recCounts:recCounts
        };
    };
