// Grade 1 Math question bank — isolated generation module.
// Self-contained: unit names are defined here because this file loads
// before the main page script and must not reference its globals.
function mathChoices(answer, spread){
        const a=Number(answer), step=spread||1, vals=[a,a+step,a-step,a+2*step,a-2*step,a+3*step];
        const out=[]; for(const v of vals){if(v>=0&&!out.includes(v))out.push(v);if(out.length===4)break;}
        return out.map(String);
    }
    function mathMC(title,prompt,answer,hint,explanation,choices){
        const opts=(choices||mathChoices(answer)).map(String); return {title,prompt,choices:opts,answer:String(answer),hint,explanation};
    }
    function buildGrade1MathDataBank(){
        const u1=[],u2=[],u3=[],u4=[],u5=[],u6=[];
        for(let a=2;a<=19&&u1.length<18;a+=1){const b=(a*3)% (21-a); if(b>0&&a+b<=20)u1.push(mathMC('Add within 20','What is '+a+' + '+b+'?',a+b,'Count on from the larger number.',''+a+' plus '+b+' equals '+(a+b)+'.'));}
        for(let a=20;a>=2&&u1.length<36;a--){const b=(a*2)%a+1;if(b<a)u1.push(mathMC('Subtract within 20','What is '+a+' − '+b+'?',a-b,'Count back '+b+' from '+a+'.',''+a+' minus '+b+' equals '+(a-b)+'.'));}
        while(u1.length<36){const a=10+(u1.length%9),b=1+(u1.length%8);u1.push(mathMC('Math story','Leo has '+a+' blocks and gets '+b+' more. How many blocks does he have now?',a+b,'Getting more means add.',''+a+' + '+b+' = '+(a+b)+'.'));}
        for(let n=0;n<36;n++){
            const base=[18,27,34,41,52,63,70,79,86,95,103,110][n%12], mode=n%4;
            if(mode===0)u2.push(mathMC('Number after','What number comes after '+base+'?',base+1,'Count one more.',''+(base+1)+' comes after '+base+'.'));
            else if(mode===1)u2.push(mathMC('Number before','What number comes before '+base+'?',base-1,'Count one less.',''+(base-1)+' comes before '+base+'.'));
            else if(mode===2){const x=base,y=base+(n%2?7:-6),ans=Math.max(x,y);u2.push(mathMC('Compare numbers','Which number is greater: '+x+' or '+y+'?',ans,'Compare the tens first.',''+ans+' is greater.'));}
            else {const mid=base;u2.push(mathMC('Number between','Which number is between '+(mid-1)+' and '+(mid+1)+'?',mid,'Count one step from '+(mid-1)+'.',''+mid+' is between the two numbers.'));}
        }
        for(let n=0;n<36;n++){
            const num=12+(n*7)%88, tens=Math.floor(num/10), ones=num%10, mode=n%4;
            if(mode===0)u3.push(mathMC('Tens and ones','How many tens are in '+num+'?',tens,'Look at the tens digit.',''+num+' has '+tens+' tens.'));
            else if(mode===1)u3.push(mathMC('Ones place','How many ones are in '+num+'?',ones,'Look at the ones digit.',''+num+' has '+ones+' ones.'));
            else if(mode===2)u3.push(mathMC('Expanded form','Which is the expanded form of '+num+'?',num,'Break the number into tens and ones.',''+num+' = '+(tens*10)+' + '+ones+'.',[String(tens*10)+' + '+ones,String(tens)+' + '+ones,String(tens*10)+' + '+(ones+1),String(tens*10+1)+' + '+ones]));
            else {const target=tens*10+ones;u3.push(mathMC('Build a number','Which number has '+tens+' tens and '+ones+' ones?',target,'Tens are groups of ten.',''+tens+' tens and '+ones+' ones make '+target+'.'))}
        }
        const lengths=[3,5,7,9,4,6,8,10], times=[1,2,3,4,5,6,7,8,9,10,11,12];
        for(let n=0;n<36;n++){
            const mode=n%4;
            if(mode===0){const len=lengths[n%lengths.length];u4.push(mathMC('Measure length','A pencil is '+len+' units long. How long is it?',len,'Read the measurement carefully.','The pencil is '+len+' units long.'));}
            else if(mode===1){const a=lengths[n%8],b=lengths[(n+3)%8],ans=Math.max(a,b);u4.push(mathMC('Compare length','Which is longer: an object that is '+a+' units or one that is '+b+' units?',ans+' units','More units means longer.','The object measuring '+ans+' units is longer.',[a+' units',b+' units',(Math.min(a,b)+1)+' units',(Math.max(a,b)+1)+' units']));}
            else if(mode===2){const t=times[n%12];u4.push(mathMC('Tell time','What time is shown when the hour hand is on '+t+' and the minute hand is on 12?',t+' o’clock','Minute hand on 12 means an exact hour.','The time is '+t+' o’clock.',[t+' o’clock',((t%12)+1)+' o’clock',((t+2)%12||12)+' o’clock',((t+3)%12||12)+' o’clock']));}
            else {const a=2+(n%6),b=3+((n*2)%7),c=1+(n%5),total=a+b+c;u4.push(mathMC('Read data','A chart has '+a+' red, '+b+' blue, and '+c+' green objects. How many objects are there in all?',total,'Add all three groups.',''+a+' + '+b+' + '+c+' = '+total+'.'));}
        }
        const shapes=[['triangle',3],['square',4],['rectangle',4],['hexagon',6]];
        for(let n=0;n<36;n++){
            const [shape,sides]=shapes[n%shapes.length],mode=n%4;
            if(mode===0)u5.push(mathMC('Name a shape','Which shape has '+sides+' sides?',shape,'Count the sides.','A '+shape+' has '+sides+' sides.',[shape,shapes[(n+1)%4][0],shapes[(n+2)%4][0],shapes[(n+3)%4][0]]));
            else if(mode===1)u5.push(mathMC('Count sides','How many sides does a '+shape+' have?',sides,'Trace around the shape and count.','A '+shape+' has '+sides+' sides.'));
            else if(mode===2){const ans=n%2?'square':'rectangle';u5.push(mathMC('Equal sides','Which shape has 4 sides and 4 equal sides?',ans,'Think about a shape with four equal sides.','A '+ans+' has four sides; a square has four equal sides.', ['square','rectangle','triangle','hexagon']));}
            else {const total=4+(n%5);u5.push(mathMC('Shape parts','A shape is split into '+total+' equal parts. How many parts are there?',total,'The number is given in the problem.','There are '+total+' equal parts.'));}
        }
        for(let n=0;n<36;n++){
            const a=3+(n%9), b=1+((n*3)%9), add=n%3!==0, ans=add?a+b:a-b;
            if(add)u6.push(mathMC('Word problem','Ava has '+a+' stickers and gets '+b+' more. How many stickers does she have?',ans,'Gets more means add.',''+a+' + '+b+' = '+ans+'.'));
            else u6.push(mathMC('Word problem','Noah has '+a+' apples and eats '+b+'. How many apples are left?',ans,'Eating some means subtract.',''+a+' − '+b+' = '+ans+'.'));
        }
        const unitNames=['Addition & Subtraction Within 20','Numbers to 120','Place Value: Tens & Ones','Measurement, Time & Data','Geometry','Word Problems & Problem Solving'];
        return [u1,u2,u3,u4,u5,u6].map((lessons,i)=>({unit:unitNames[i],lessons}));
    }
    window.KC_G1_MATH = buildGrade1MathDataBank();
