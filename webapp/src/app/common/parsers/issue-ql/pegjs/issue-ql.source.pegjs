Expression
  = head:Term tail:(_ (OrToken) _ Term)* {
      // 'expression' is an OR expression
      let expression = {
        "type": "expression",
        "terms": [head]
      };
      return tail.reduce(function(result, element) {
        result["terms"].push(element[3]);
        return result;
      }, expression);
    }

Term
  = head:Factor tail:(_ (AndToken) _ Factor)* {
      let term = {
        "type": "term",
        "factors": [head]
      };
      return tail.reduce(function(result, element) {
        term["factors"].push(element[3]);
        return result;
      }, term);
    }

Factor
  = OpenBracket _ expr:Expression _ CloseBracket { return expr; }
  / NotExpression
  / FactorExpression
  / EmptyFactorExpression
  / NotEmptyFactorExpression
  / InFactorExpression
  / NotInFactorExpression

NotExpression
  = NegateToken OpenBracket _ expr:Expression  _ CloseBracket {
    expr['not'] = true;
    return expr;
  }


FactorExpression
  = factorId:FactorId _ operator:(EqualsToken / NotEqualsToken) _ factorValue:FactorValue {
      return {
        "type": "factor-expression",
        "id": factorId,
        "operator": operator,
        "value": factorValue
      };
    }

EmptyFactorExpression
  = factorId:FactorId _ IsToken _ EmptyToken {
      return {
        "type": "empty-factor-expression",
        "id": factorId,
        "not": false
      }
    }

NotEmptyFactorExpression
  = factorId:FactorId _ IsToken _ not:NotToken _  EmptyToken {
      return {
        "type": "empty-factor-expression",
        "id": factorId,
        "not": true
      }
    }

InFactorExpression
  = factorId:FactorId _ InToken _ "(" _ head:FactorValue tail:(_ Comma _ FactorValue)* _ ")" {
        //This is like an OR
        let expression = {
          "type": "in-factor-expression",
          "id": factorId,
          "values": [head]
        };
        return tail.reduce(function(result, element)  {
          result["values"].push(element[3]);
          return result;
        }, expression);
    }

NotInFactorExpression
  = factorId:FactorId _ NotToken _ InToken _ "(" _ head:FactorValue tail:(_ Comma _ FactorValue)* _")" {
        //This is like an OR
        let expression = {
          "type": "in-factor-expression",
          "id": factorId,
          "values": [head],
          "not": true
        };
        return tail.reduce(function(result, element)  {
          result["values"].push(element[3]);
          return result;
        }, expression);
    }

FactorId
 = value:FACTOR_ID {
    return value;
 }

FactorValue
 = value:STRING {
    return value;
 }

/* Tokens */
OpenBracket     = "("
AndToken        = "and"i
CloseBracket    = ")"
Comma           = ","
EmptyToken      = "empty"i
EqualsToken     = "="
FalseToken      = "false"
IsToken         = "is"i
InToken         = "in"i
NotToken        = "not"i
NegateToken     = "!"
NotEqualsToken  = "!="
OrToken         = "or"i
TrueToken       = "true"

/* Literals */
FACTOR_ID = ASSIGNEE / COMPONENT / FIX_VERSION / LABEL / PRIORITY / PROJECT / TYPE
ASSIGNEE      = "assignee"i
COMPONENT     = "component"i
FIX_VERSION   = "fixVersion"i
LABEL         = "labels"i
PRIORITY      = "priority"i
PROJECT       = "project"i
TYPE          = "type"i


STRING "string"
  = string:string { return string; }

string1
  = '"' chars:([^\n\r\f\\"] / "\\" nl:nl { return ""; } / escape)* '"' {
      return chars.join("");
    }

string2
  = "'" chars:([^\n\r\f\\'] / "\\" nl:nl { return ""; } / escape)* "'" {
      return chars.join("");
    }

string
  = string1
  / string2

nl
  = "\n"
  / "\r\n"
  / "\r"
  / "\f"

escape
  = unicode
  / "\\" ch:[^\r\n\f0-9a-f]i { return ch; }

unicode
  = "\\" digits:$(h h? h? h? h? h?) ("\r\n" / [ \t\r\n\f])? {
      return String.fromCharCode(parseInt(digits, 16));
    }

h
  = [0-9a-f]i

_ "whitespace"
  = [ \t\n\r]*

