
var Templates = null;

function CreateTemplateCard(template_path, file_name)
{
	var field_name = 'null';
	var signature_ColumnTouched = "ColumnTouched()";
	var signature_ColumnOver = "EditTemplate('"+template_path+"')";
	var signature_ColumnDoubleClick = "ColumnNavigate()";
	var signature_ColumnDoubleClick = "ColumnNavigate()";
	return $('<div class="my_table_card object_tab_element" ondblclick="' + signature_ColumnDoubleClick + '" onclick="' + signature_ColumnTouched + '" onmouseenter="'+signature_ColumnOver+'" >' + file_name + '</div>');
}

var DirtyTemplate = false;
var TemplateVariables = { "Columns" : [] }; // varibles in json area

var SelectedTemplate = null;

function GetTemplateByPath(file_path)
{
	return Templates.CS['POCO.txt'];
}

function EditTemplate(template_path)
{
	if (DirtyTemplate)
	{
		// currently edited template is not saved
		return;
	}
	var postdata =
	{
		"action" : "edit_template",
		"template_path" : template_path,
	};
	$.ajax({
		type: "POST",
		url: './TemplateExample1.txt',
		data: JSON.stringify(postdata) //, dataType: "json"
	}).done(function(data, m, n)
	{
		//ControlKeyIsPressed = true;
		SelectedTemplate = GetTemplateByPath(data.TemplatePath);
		SelectedTemplate.Content = data; // data.Content;
		SelectedTemplate.TemplatePath = './TemplateExample1.txt'// data.TemplatePath;
		var val = SelectedTemplate.Content;
		
		/*
		only used for JSON on my local project
		val = val.replace(/\\n/g, '\n');
		val = val.replace(/\\t/g, '\t');
		val = val.replace(/\\r/g, '\r');
		val = val.replace(/\\f/g, '\f');
		// val = val.replace(/\\b/g, '\b');
		val = val.replace(/\\\//g, '\/');
		val = val.replace(/\\\\/g, '\\');
		val = val.replace(/\\"/g, '\"');
		*/
    	//$escapers = array( "\x08", "\x0c", "\xa9");
    	//$replacements = array( "\\f", "\\b", "(c)");

		$('#TemplatePanelInput').val(val);		
		BuildTemplate();
		ApplyTemplate();
	}).fail(FailedAction);
}

function BuildTemplate()
{
	if(SelectedTemplate)
	{
		var Result = SelectedTemplate.Content.substring(1, SelectedTemplate.Content.length-1);
		Lines = Result.split("\n");
		var VariablesOutput = '';
		var isInBlock = -1;
		var VariablesBlock = [];
		for(var l=0; l<Lines.length; l++)
		{
			if(Lines[l].indexOf('============== Vars') > -1)
			{
				if(Lines[l].indexOf(' begin')>-1)
				{
					isInBlock++;
					VariablesBlock[isInBlock] = '';
				}
				if(Lines[l].indexOf(' end')>-1)
				{
					//VariablesOutput += ExpandBlock(VariablesBlock[isInBlock]);
					isInBlock--;
				}
			}
			else
			{
				if(isInBlock >= 0)
				{
					VariablesBlock[isInBlock] += Lines[l]+' \n';
				}
				else
				{
					VariablesOutput += Lines[l]+' \n';
				}
			}
		}
		if(VariablesBlock.length>0)
		{
			TemplateVariables = jQuery.parseJSON(VariablesBlock[0].replace(/\\t/g, '\t').replace(/\\n/g, '\n').replace(/\\\"/g, '"').replace(/\//g, '/'));
		}
	}
}

function Template_Preset_Editor()
{
	$('#TemplatePanelOutput').css({ left : "2000" });
	$('#TemplatePanelInput').css({ width : "100%" });
}

function Template_Preset_Hibrid()
{
	$('#TemplatePanelOutput').css({ left : "600" });
	$('#TemplatePanelInput').css({ width : "320" });
}

function Template_Preset_Output()
{
	$('#TemplatePanelOutput').css({ left : "280" });
	$('#TemplatePanelInput').css({ width : "0" });
}

function Template_Preset_Ready()
{
	$('#TemplateCopyArea').val($('#TemplatePanelOutput')[0].innerText);
	$('#TemplateCopyArea').toggle();
}

var currentVariables = null;
function ApplyVatiables(line, variables, index)
{
	currentVariables = variables;
	
	// Remove first separator
	if(index == 0)
	{
		line = line.replace(new RegExp("@\\^,\\^@","g"), "");
	}
	else
	{
		line = line.replace(new RegExp("@\\^,\\^@","g"), "<span class='template_uppercase'>,</span>");
	}
	
	// Evaluate conditionals
	var regex = new RegExp("@``([^``@]*)``@``([^`]*)``@","g");
	line = line.replace(regex, function(match, expression, content) 
	{
		if(TemplateVariables.hasOwnProperty("Translates"))
		{
			if(TemplateVariables.Translates.hasOwnProperty(expression))
			{
				return TemplateVariables.Translates[expression][currentVariables[content]];
			}
			else
			{
				return "";
			}
		}
	});
	
	
	// Evaluate conditionals
	var regex = new RegExp("@~([^~@]*)~@~([^~]*)~@","g");
	line = line.replace(regex, function(match, expression, content) 
	{
		if(currentVariables.hasOwnProperty(expression))
		{
			return content;
		}
		else
		{
			return "";
		}
	});
	
	// Replace variables
	jQuery.each(variables, function(i, val) 
	{
		if(typeof(val) == "string")
		{
			line = line.replace(new RegExp("@<"+i+">@","g"), "<span class='template_uppercase'>" + val.toUpperCase() + "</span>");
			line = line.replace(new RegExp("@{"+i+"}@","g"), "<span class='template_uppercase'>" + val + "</span>");
			line = line.replace(new RegExp("@["+i+"]@","g"), "<span class='template_lowercase'>" + val.toLowerCase()+"</span>");
		}
	});
	return line;
}

function ApplyTemplate()
{
	if(SelectedTemplate)
	{
		var Result = SelectedTemplate.Content.substring(1, SelectedTemplate.Content.length-1);
		Result = Result.replace(/ /g, '&nbsp;');
		Result = Result.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
		Result = Result.replace(/</g, '&lt;');
		Result = Result.replace(/\"/g, '"');
		Result = Result.replace(/\//g, '/');
		//Result = Result.replace(/\\n/g, '</br>');
		TemplateLines = Result.split("\n");
		
		var TemplateOutput = '';
		block='';
		var ExpansionBlocks = [];
		var FragmentLines = [];
		var ignore = false;// to ignore metadata like variables
		
		for(var l=0; l<TemplateLines.length; l++)
		{
			if(TemplateLines[l].indexOf("==============&nbsp;Vars")>-1)
			{		
				if(TemplateLines[l].indexOf('&nbsp;begin')>-1)
				{
					ignore = true;
				}
				if(TemplateLines[l].indexOf('&nbsp;end')>-1)
				{
					ignore = false;
					continue;
				}
			}
			if(ignore)
			{
				continue;
			}
			FragmentLines.push(TemplateLines[l]);
		}
		TemplateOutput = SolveFragment(FragmentLines, TemplateVariables);
		$('#TemplatePanelOutput').html(TemplateOutput);
	}
}
		
function SolveFragment(Lines, variables, index)
{
	var isInBlock = 0;
	var CurrentFragmantName = "";
	var CurrentFragmantLines = [];
	var FragmentOutput = "";
	
	for(var l=0; l<Lines.length; l++)
	{	
		if(Lines[l].indexOf("=================&nbsp;Fragment&nbsp;")>-1)
		{
			var marker = Lines[l].replace(/&nbsp;/g, ' ');
			var indexOfFragmentMarker = marker.indexOf("================= Fragment ");
			FragmantName = marker.substring(indexOfFragmentMarker + 27).trim();
			FragmantName = FragmantName.substring(0, FragmantName.indexOf(" "));
			FragmentLines = [];
		
			if(marker.indexOf(' begin')>-1 && isInBlock == 0)
			{
				isInBlock++;
				CurrentFragmantName = FragmantName;
				CurrentFragmantLines = [];
			}
			else
			if(marker.indexOf(' end')>-1 && FragmantName == CurrentFragmantName)
			{
				if(Array.isArray(variables[CurrentFragmantName]))
				{
					for(var ti=0; ti<variables[CurrentFragmantName].length; ti++)
					{
						FragmentOutput += SolveFragment(CurrentFragmantLines, variables[CurrentFragmantName][ti], ti);
					}
				}
				isInBlock--;
			}
			else if(FragmantName != CurrentFragmantName)
			{
				CurrentFragmantLines.push(Lines[l]);
			}
		}
		else
		{
			if(isInBlock > 0)
			{
				CurrentFragmantLines.push(Lines[l]);
			}
			else
			{
				FragmentOutput += ApplyVatiables(Lines[l], variables, index)+'<br>\n';
			}
		}
	}
	return FragmentOutput;
}


function ExpandBlock(BlockToExpand)
{
	var ExpandedBlock = '';
	for(var c=0; c<MyModel.PinnedObjects.LookupForeignKeys.length; c++)
	{
		var block = BlockToExpand.replace(/\{\{Column\}\}/g, "<span class='template_uppercase'>"+MyModel.PinnedObjects.LookupForeignKeys[c].field_name+"</span>");
		block = block.replace(/\{\[Column\]\}/g, "<span class='template_lowercase'>"+MyModel.PinnedObjects.LookupForeignKeys[c].field_name.toLowerCase()+"</span>");
		ExpandedBlock += block;
	}
	for(var c=0; c<TemplateVariables.Columns.length; c++)
	{
		var block = BlockToExpand.replace(/\{\{Column\}\}/g, "<span class='template_uppercase'>"+TemplateVariables.Columns[c]+"</span>");
		block = block.replace(/\{\[Column\]\}/g, "<span class='template_lowercase'>"+TemplateVariables.Columns[c].toLowerCase()+"</span>");
		ExpandedBlock += block;
	}
	return ExpandedBlock;
}

function TemplateIsEdited()
{
	//DirtyTemplate = true;
	// saved directly
	SaveTemplate()
}

function SaveTemplate()
{
	var postdata =
	{
		"action" : "save_template",
		"template_path" : SelectedTemplate.TemplatePath,
		"content" : JSON.stringify($('#TemplatePanelInput').val())
	};
	$.ajax({
		type: "POST",
		url: './api/templater/index.php',
		data: JSON.stringify(postdata),
		dataType: "json"
	}).done(function(data, m, n)
	{
		SelectedTemplate = GetTemplateByPath(data.TemplatePath);
		SelectedTemplate.Content = data.Content;
		BuildTemplate();
		ApplyTemplate();
	}).fail(FailedAction);
}

function FailedAction(a, b, c)
{
	console.log(a.responseText);
}

function DisplayTemplates()
{
	if(typeof(DisplayOnly) === "function")
	{
		DisplayOnly('Templates');
	}
	$('#TemplatesList').empty();
	var postdata =
	{
		"action" : "list_templates"
	};
	$.ajax({
		type: "POST",
		url: './templates_list.json', // On local use: './api/templater/index.php',
		data: JSON.stringify(postdata),
		dataType: "json"
	}).done(function(data, m, n)
	{
		Templates = data;
		for (var folder_name in data) {
			if (data.hasOwnProperty(folder_name)) {
				for (var template_name in data[folder_name]) {
					if (data[folder_name].hasOwnProperty(template_name)) {
						var card = CreateTemplateCard(folder_name+'/'+template_name, folder_name + ' ' + template_name.substring(0, (template_name.length	)-4));
						$('#TemplatesList').append(card);
					}
				}
			}
		}
		
			
		var FloatingCards_FilterValue = getCookie("FloatingCards_FilterValue"); 
		$('#cards_filter_input').val(FloatingCards_FilterValue); 
		FilterFloatingCards(FloatingCards_FilterValue);
		
		// process a default template EditTemplate('TemplateExample1.txt');
		/* This area is only for github. Because they disabled the load of resourcs. */
		BuildTemplate();
		ApplyTemplate();
	});
	
}