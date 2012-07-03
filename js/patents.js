//globals
var legend_classes = {};
var legend_topics = {};

//global variable that holds selected patent data
var patentdata = [];
var awards = []; //holds award data for selected params, used to compare input and output

function init() {
//alert(proposalaccessallowed);
	//on page load
	$($('#classes_tabs_template').tmpl()).appendTo('#classes_tabs_container');
	$($('#classes_summary_template').tmpl()).appendTo('#classes_summary_container');

	//load topic legend
	$.getJSON(apiurl+'topic?legend=topic'+'&jsoncallback=?', function(data) {
		_.each(data, function(item) {
			legend_topics[item["topic"]] = {"words":item["words"],"label":item["label"]};
		});
	});			

	//load classes legend
	$.getJSON(apiurl+'patent?legend=class'+'&jsoncallback=?', function(data) {
		_.each(data, function(item) {
			legend_classes[item["class"]] = item["label"];
		});
		//loadPatents();
		$('#patents').hide();
		//hide loader
		$('#data_loader').hide();	
		//show
		$('#main').show();	
		$('a#queryform_submit').removeClass("disabled");
	});			
	
	//hide
	$('#queryform_summary_collapsed').hide();
	$('#classes_summary_collapsed').hide();
	$('#classes').hide();
	$('#data_container').hide();
	$('#divisions_tabs').tabs();
	$('#classes_tabs').tabs();
	$('a[id^=queryform_submit_]').addClass("disabled");
	$('a[id^=classes_submit]').addClass('disabled');
	$('#filter_year').hide();

	loadDivisions();

	//pge code
	$('input[name="filter_pge"]').focus(function(event) {
		//set selection
		$('input[name="filter_pge_type"]').filter("[value=some]").attr("checked","checked");
	});
	$('input[name="filter_pge_type"]').click(function(event) {
		if ($(this).val()=='all') $('input[name="filter_pge"]').val('');
	});

	/* queryform submit - load classes
		hide queryform
		set querysummary
		show querysummary
		load classes
		show classes
	*/
	$('a#queryform_submit_classes').click(function() {
		if (!$(this).hasClass('disabled')) {		
			//make query params
			var queryparams = '';
			//years
			queryparams = 'year='+$('select[name=filter_year] option:selected').val();		
			//orgs
			var oTable = $('#divisions_table').dataTable();		
			//check to make sure one or more divisions are selected
			var selectedRows = fnGetSelected(oTable);
		//console.log(selectedRows);		
			var selected_orgs = _.pluck(selectedRows, 0);
		//console.log(selected_orgs);
			//pge codes
			if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) selected_orgs.push($('input[name=filter_pge]').val().replace(/ /gi, ""));
		//console.log(selected_orgs);	
			if (selected_orgs.length==0) { 
				alert('Please select a division or specify some PGE codes'); 
				//$('#data_loader').hide(); 
				$('#patents_loader').hide();
				$('a#queryform_submit').removeClass("disabled");
				return; 
			}
			queryparams += '&org='+selected_orgs.join(',');
			queryparams += '&status=award';
			
			$('#queryform').hide();		
			//enable change selection button		
			$('a#queryform_summary_change').removeClass('disabled');		
			//set query summary
			//orgs
			$('#queryform_summary_orgs_count_selected').html(selectedRows.length);
			$('#queryform_summary_orgs_count').html(oTable.fnGetData().length);
			$('#queryform_summary_orgs_selected').html(_.pluck(selectedRows, 0).join(', '));
			//years
			$('#queryform_summary_filter_year').html($('select[name=filter_year] option:selected').text());
			//pge codes
			if ($("input[name=filter_pge_type]:checked").val()=='all') $('#queryform_summary_filter_pge').html('All');
			else $('#queryform_summary_filter_pge').html($('input[name=filter_pge]').val());	
			
			$('#queryform_summary_expanded').hide();
			$('#queryform_summary_collapsed').show();
			//collapse
			$('#divisions_container').removeClass('expanded');
			$('#divisions_container').addClass('collapsed');
			//expand
			$('#classes_container').removeClass('collapsed');
			$('#classes_container').addClass('expanded');
	
			//reset summaries
			$('#classes_summary_collapsed').hide();
			//reset classes
			resetClasses();
			//load classes
			$('#classes').show();
			//before we load classes, get a count of awards by year for selected params
			//we use this to show comparison between input and output
			//load data
			$.getJSON(apiurl+'topic?' + queryparams + '&summ=year' + '&jsoncallback=?', function(data) {			
				awards = data["data"];
				loadClasses(queryparams);			
			});
		}
		
		return false;
	});
	
	/** querysummary **/
	/* change selection click
		hide querysummary
		hide classes
		hide classesummary
		hide data
		show queryform
	*/
	$('a#queryform_summary_change').click(function() {
		if (!$(this).hasClass('disabled')) {		
			$('#classes').hide();
			$('#data_container').hide();
			$('#queryform').show();
			//set classes
			$('#divisions_container').removeClass('collapsed');
			$('#divisions_container').addClass('expanded');
			$('#classes_container').removeClass('expanded');
			$('#classes_container').addClass('collapsed');
			$('#results_container').removeClass('expanded');
			$('#results_container').addClass('collapsed');		
			
			//disable this until view classes is selected again
			$(this).addClass('disabled');
		}
				
		return false;
	});

	/** divisions datatable events **/
	/* multiselect checkbox click captured by generic function, triggered by multiselect class on checkbox */
	/* division select checkbox
		mark datatable row as selected/unselected
	*/
	$('input[name="division[]"]').live('click',function() {
		if ($(this).attr('checked')) {
			setRowSelected($(this).parent().parent());
		}
		else {
			//set the class
			setRowUnSelected($(this).parent().parent());
		}
	});

	/** classes **/
	/** classes datatable events **/
	/* multiselect checkbox click captured by generic function, triggered by multiselect class on checkbox */
	/* class select checkbox
		mark datatable row as selected/unselected
		show/hide showresults buttons
		update selection summary
	*/
	$('input[name="class[]"]').live('click',function() {
		var classid = $(this).val();
	
		//update row selections
		if ($(this).attr('checked')) {
			setRowSelected($(this).parent().parent());
		} else {
			//set the class
			setRowUnSelected($(this).parent().parent());
		}
		
		//filter rawdata by selected divisions and selected classes
		var oTable = $('#divisions_table').dataTable();		
		var selectedRows = fnGetSelected(oTable);
//console.log(selectedRows);
		var selected_orgs = _.pluck(selectedRows, 0);
//console.log(selected_orgs);		
		var oTable = $('#classes_table').dataTable();
		var selectedRows = fnGetSelected(oTable);
		//get selected classes
		var selected_classes = _.pluck(selectedRows, 0);
//console.log(_.pluck(selectedRows,2));

		//reset
		resetClassSummary();
		$('#classes_summary_patents_count').html('');
		
		//update summary
		//updateClassSummary(selectedRows);

		//get additional summary data for div, pge, year, institutions, researchers
		if (selectedRows.length>0) {
			var count = 0;
			_.each(_.pluck(selectedRows,3),function(row) {
				count += row;
			});
			$('#classes_summary_patents_count').html(count);
			$('#classes_submit_patents').removeClass('disabled');
		}
	});
	
	$('#classes_selection_clear').click(function(event) {
		clearClassSelection();
		$('#classes_summary_patents_count').html('');
		event.preventDefault();
	})
	
	/** classesummary **/
	/* change selection click
		hide classesummary
		hide data
		show classes
	*/
	$('a#classes_summary_change').click(function() {
		if (!$(this).hasClass('disabled')) {		
			$('#classes').show();
			$('#data_container').hide();
			//set classes
			$('#classes_container').removeClass('collapsed');
			$('#classes_container').addClass('expanded');
			$('#results_container').removeClass('expanded');
			$('#results_container').addClass('collapsed');		

			//disable this until view classes is selected again
			$(this).addClass('disabled');
		}
		
		return false;
	});
	
	/** showresults **/
	//engage ui tabs for data tabs
	$('#data_tabs').tabs({
		select: function(event, ui) {
			var url = $(ui.tab).attr('href');
//console.log(url);			
	        if( url ) {
				var tab = url.split('_').pop();
				//show Tab
				showTab(tab);
	        }
	        return true;
		}		
	});
	
	/* showresults buttons click
		one or more classes must be selected
		hide classes
		set classesummary
		show classesummary
		load data (based on target tab i.e. proposals, awards, researchers, institutions
		show data
	*/
	$('a[id^=classes_submit]').click(function() {
		if (!$(this).hasClass('disabled')) {		
			var oTable = $('#classes_table').dataTable();		
			//check to make sure one or more divisions are selected
			var selectedRows = fnGetSelected(oTable);
	//console.log(selectedRows);		
			if (selectedRows.length==0) { alert('Please select a class'); return false; }
	//console.log(selectedRows);
			var selected_classes = _.map(selectedRows, function(item) {
				return '<span><strong>'+item[1]+':</strong> '+item[2]+'</span>';
			});
	//console.log(selected_orgs);		
		
			$('#classes').hide();
			//enable change selection button		
			$('a#classes_summary_change').removeClass('disabled');		
		
			//set class summary
			$('#classes_summary_count_selected').html(selectedRows.length);
			$('#classes_summary_count').html(oTable.fnGetData().length);
			$('#classes_summary_selected').html(selected_classes.join(''));		
			$('#classes_summary_expanded').hide();
			$('#classes_summary_collapsed').show();
			//collapse classes
			$('#classes_container').removeClass('expanded');
			$('#classes_container').addClass('collapsed');
			//expand results
			$('#results_container').removeClass('collapsed');
			$('#results_container').addClass('expanded');
		
			//clear out existing data before showing to reset old results
			$('#patents_table').empty();
		
			//deselect all tabs
		    $('#data_tabs').tabs( 'selected' , -1 );
		    $(".ui-tabs-selected").removeClass("ui-state-active").removeClass("ui-tabs-selected");
		
			//determine tab to show (in id of link, separate by _ and use last slice)
			var tab = $(this).attr('id').split('_').pop();
			//show appropriate tab
			//find the index
			var index = $('#data_tabs a[href="#'+'data_tabs_'+tab+'"]').parent().index();
	//console.log(index);	
			$('#data_tabs').tabs('select', index);
		
			$('#data_container').show();		
		}
		return false;
	});
	
	//pge code lookup event
	$('span[id^=pgecode_lookup_]').live('mouseover',function(event) {
		var link = this;
		if ($(this).attr('title')=='') {
			//not previously retrieved
			//get the pge code
			var pgecode = $(link).attr('id').split('_').pop();
			if (pgecode) {
				$(this).attr('title','Retrieving...');
				$.getJSON(apiurl+'proposal?legend=nsf_pge&q='+pgecode+'&jsoncallback=?', function(data) {
					if (data.length>0 && data[0]["nsf_pge"]) $(link).attr('title',data[0]["label"]);
				});			
			}
		}
	});	 

	/** patents datatable **/
	$('#patents_table > tbody > tr:not(.details)').live('click', function (event) {   
		var oTable = $('#patents_table').dataTable();

		//if the show details link was clicked trap that		
	   if(event.target.nodeName == "A"){
			if (!$(event.target).hasClass('patent_details') && $(event.target).attr('id').substr(0,15)!='pid_researcher_') {		
				return;
			} else {				
				if ($(event.target).attr('id').substr(0,15)=='pid_researcher_') {
					var researcher_id = $(event.target).attr('id').substr(15);
					var elem = $('a[class*="patent_details"]', this);
				} else {
					var researcher_id = null;
					var elem = $(event.target);
				}
//console.log(elem.attr('id'));
//console.log(elem.attr('id').substr(0,15));
//console.log(researcher_id);				
				//toggle details
				selectPatent(oTable,this,elem,researcher_id);
			}
			event.preventDefault();
		} else {
			var elem = $('a[class*="patent_details"]', this);
//console.log(elem);			
			//toggle details
			selectPatent(oTable,this,elem,null);
		}

	    var aData = oTable.fnGetData(this); // get datarow
	    if (null != aData)  // null if we clicked on title row
	    {
			//set the class
			if ( $(this).hasClass('row_selected') ) {
				$(this).removeClass('row_selected');
				$(this).removeClass('DTTT_selected');
			} else {
				$(this).addClass('row_selected');
				$(this).addClass('DTTT_selected');
			}
	    }
	});
}

/** DIVISIONS **/
/*loadDivisions */
/*
triggered on page load
divisions data retrieved from the data source

Returns: JSON data
*/
function loadDivisions() {
	var queryparams = makeAPIQueryParamString();
	queryparams += '&summ=org,status';
	//pge codes
	if ($("input[name=filter_pge_type]:checked").val()!='all' && $('input[name=filter_pge]').val()) queryparams += '&org='+$('input[name=filter_pge]').val().replace(/ /gi, "");
//console.log(apiurl+'topic?'+queryparams+'&jsoncallback=?');	
	$.getJSON(apiurl+'topic?'+queryparams+'&jsoncallback=?', function(data) {
		initDivisions(data["data"]);
		//hide loader
		$('#data_loader').hide();
		//show main content container
		$('#main').show();
		//divisions
		$('#divisions_loader').hide();
		$('#divisions_tabs').show();
		$('a[id^=queryform_submit_]').removeClass("disabled");
	});
}

/* initDivisions */
/*
divisions data loaded into datatable

Param: data (JSON data)

Returns: nothing
*/
function initDivisions(rawdata) {
	//prepare data
	//group by org
	var grouped = _.groupBy(rawdata,function(row) { return row["org"]; });
	var collated = [];
	//now using the master list
	for (var org in divisions) {
		var tmp = {};
		tmp["org"] = org;
		tmp["title"] = divisions[org];
		tmp["directorate"] = directorates[org]==undefined?'Other':directorates[org];
		tmp["parentdivision"] = parentdivision[org]==undefined?'':parentdivision[org];
		collated.push(tmp);
	}
//console.log(collated);	
	//sort by title
	//collated = _.sortBy(collated,function(row) { return row["title"]; });
	//prepare for datatable data - conv to array
	var aaData = _.map(collated, function(row) {
		return [row["org"], row["title"], row["directorate"],row["parentdivision"]];
	});
//console.log(collated);			
//console.log(tmp);		
	
//console.log(aaData);
	var oTable = $('#divisions_table').dataTable({
		//TableTools - copy, csv, print, pdf
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		"bDestroy": true,
		"bProcessing": true,
		"bAutoWidth": false,
		"iDisplayLength": 50,
		"aaData": aaData,
		"fnDrawCallback": function ( oSettings ) {
			if ( oSettings.aiDisplay.length == 0 )
			{
				return;
			}			
			var nTrs = $('#divisions_table tbody tr');
			var iColspan = nTrs[0].getElementsByTagName('td').length;
			var sLastGroup = "";
			var sLastSubGroup = "";
			for ( var i=0 ; i<nTrs.length ; i++ )
			{
				var iDisplayIndex = oSettings._iDisplayStart + i;
				var sGroup = oSettings.aoData[ oSettings.aiDisplay[iDisplayIndex] ]._aData[2];
				var sSubGroup = oSettings.aoData[ oSettings.aiDisplay[iDisplayIndex] ]._aData[3]; //parent 
				if ( sGroup != sLastGroup )
				{
					/*var nGroup = document.createElement( 'tr' );
					var nCell = document.createElement( 'td' );
					nCell.colSpan = iColspan;
					nCell.className = "group";
					nCell.innerHTML = sGroup;
					nGroup.appendChild( nCell );
					nTrs[i].parentNode.insertBefore( nGroup, nTrs[i] );
					sLastGroup = sGroup; replaced with jquery below */
					$('<tr><td class="group" colspan="'+iColspan+'">'+sGroup+'</td></tr>').insertBefore(nTrs[i]);
					sLastGroup = sGroup;
					//reset subgroup
					sLastSubGroup = "";
				}
				if (sSubGroup != sLastSubGroup) {
		//console.log(sSubGroup);					
					$('<tr><td class="group" colspan="'+iColspan+'" style="padding-left: 20px;">'+sSubGroup+'</td></tr>').insertBefore(nTrs[i]);
					sLastSubGroup = sSubGroup;					
				} 
			}
		},
		"aoColumnDefs": [
			{
				"fnRender": function ( oObj ) {
					return '<input type="checkbox" name="division[]" value="'+oObj.aData[0]+'">';
				},
				"sClass": "center",
				"bSearchable": false,
				"bSortable": false,
				"bUseRendered": false,
				"sTitle": "Select",
				"aTargets": [ 0 ]
			},
			{
				"fnRender": function ( oObj ) {
					return oObj.aData[1]+' ('+oObj.aData[0]+')';
				},
				"sTitle": "Divisions",
				"aTargets": [ 1 ]
			}
		],
		//"aaSortingFixed": [[ 2, 'asc' ]]
		//"aaSorting": [[ 1, 'asc' ]]
		"bSort": false,
		"oLanguage": {
			"sLengthMenu:": "Display _MENU_ records per page",
			"sSearch": "Keyword Filter:"
		}
	});
}

/** CLASSES **/
/** classes handling functions **/
function resetClasses() {
	resetClassSummary();
	
	//clear out existing data before showing to reset old results
	$('#classes_table').empty();	
}

function resetClassSummary() {
//console.log('resetting class summaries');
	//reset class summaries
	$('#classes_summary_count_selected').html('');
	$('#classes_summary_count').html('');
	$('#classes_summary_selected').html('');		

	//reset the class summaries
	$('span[id=classes_summary_patents_count], div[id=classes_summary_patents_year]').html('');

	//disable buttons
	$('a[id^=classes_submit]').addClass('disabled');	
}

function clearClassSelection() {
	var oTable = $('#classes_table').dataTable();
	var selectedRows = fnGetSelectedRows(oTable);
	$.each(selectedRows, function(i, item){
		$(selectedRows[i]).find('input[name="class[]"]').attr('checked',false);
		$(selectedRows[i]).removeClass('row_selected');
		$(selectedRows[i]).removeClass('DTTT_selected');
		//clear summary
		resetClassSummary();
	});
}

function updateClassSummary(selectedRows) {
	var selected_classes = _.pluck(selectedRows,0);
//console.log(selected_classes);	
	//now using the master list
	var data = [];
	_.each(selected_classes, function(patentclass) {
//console.log(patentclass);		
		var found = _.filter(patentdata, function(row) {
			return ($.inArray(patentclass,row["classes"])!=-1);
		});
//console.log(found);						
		if (found.length>0) {
			_.each(found, function(row) {
				data.push(row);
			});
		}		
	});
	//now we have it, so group etc.
	//by application year
	var grouped = _.groupBy(data,'application_year');
	//compute totals
	var collated = [];
	for (var key in grouped) {
		collated.push(_.reduce(grouped[key], function(memo, row) {
			return {"key":key,"count":memo["count"]+1};
		},{"key":key,"count":0}));
	}
	//now strip out any pge codes where there was no funding
	var appyear_collated = _.filter(collated, function(row) { return row['count'] > 0; });
//console.log(collated);	
	//sort by year
	appyear_collated = _.sortBy(appyear_collated,function(row) { return parseInt(row["key"]); });
	//by grant year
	var grouped = _.groupBy(data,'grant_year');
	//compute totals
	var collated = [];
	for (var key in grouped) {
		collated.push(_.reduce(grouped[key], function(memo, row) {
			return {"key":key,"count":memo["count"]+1};
		},{"key":key,"count":0}));
	}
	//now strip out any pge codes where there was no funding
	var grantyear_collated = _.filter(collated, function(row) { return row['count'] > 0; });
//console.log(collated);	
	//sort by year
	grantyear_collated = _.sortBy(grantyear_collated,function(row) { return parseInt(row["key"]); });
//console.log(top);	
	//and lastly build the series of awards
	var grouped = _.groupBy(awards,'year');
	//compute totals
	var collated = [];
	for (var key in grouped) {
		collated.push(_.reduce(grouped[key], function(memo, row) {
			return {"key":key,"count":memo["count"]+row["count"]};
		},{"key":key,"count":0}));
	}
	//now strip out any pge codes where there was no funding
	var awards_collated = _.filter(collated, function(row) { return row['count'] > 0; });
//console.log(collated);	
	//sort by year
	awards_collated = _.sortBy(awards_collated,function(row) { return parseInt(row["key"]); });
	//now put the two together
	var years = _.union(_.pluck(appyear_collated,'key'),_.pluck(grantyear_collated,'key'),_.pluck(awards_collated,'key'));
	var appcount = [];
	var grantcount = [];
	var awardcount = [];
	_.each(years, function(year) {
		//app year
		var found = _.filter(appyear_collated,function(row) { return row['key']==year; });
		if (found.length>0) {
			_.each(found,function(item) { appcount.push(item['count']); });
		} else appcount.push(0);
		//grant year
		var found = _.filter(grantyear_collated,function(row) { return row['key']==year; });
		if (found.length>0) {
			_.each(found,function(item) { grantcount.push(item['count']); });
		}
		//awards
		var found = _.filter(awards_collated,function(row) { return row['key']==year; });
		if (found.length>0) {
			_.each(found,function(item) { awardcount.push(item['count']); });
		}
	});
	//display
//console.log(years);	
//console.log(count);	
//console.log(funding);	
	//clear first
	$('#classes_summary_patents_year').html('');
	//create the high charts container
	var chart = new Highcharts.Chart({
       chart: {
          renderTo: 'classes_summary_patents_year',
          type: 'bar',
		  height: 1000
       },
       title: {
          text: "Awards vs. Patents"
       },
		subtitle: {
			text: "(over time)"
		},
		xAxis: {
          categories: years
       },
       yAxis: {
          title: {
             text: ''
          }
       },
    legend: {
        align: 'middle',
        verticalAlign: 'top',
        y: 50
    },
	   tooltip: {
         formatter: function() {
            return this.series.name +': '+ this.y;
         }
       },
      plotOptions: {
         bar: {
            dataLabels: {
               enabled: true,
	            formatter: function() {
	               return this.y;
	            }
            }
         }
      },
       series: [{
          name: 'Awards',
          data: awardcount
       },
		{
          name: 'Patents (Applied)',
          data: appcount
       },
		{
	          name: 'Patents (Granted)',
	          data: grantcount
	       }
		],
	   credits: {
		enabled: false
		}
    });		
}

/*loadClasses */
/*
topics data retrieved from the data source

Returns: JSON data
*/
function loadClasses(queryparams) {
	$('#classes_loader').show();
//console.log(apiurl+'topic?'+queryparams+'&jsoncallback=?');	
	//load data
	$.getJSON(apiurl+'topic?' + queryparams + '&page=patent' + '&jsoncallback=?', function(data) {
		classsummarydata_pge=[];
		classsummarydata_org=[];
		classsummarydata_year=[];
		//save data
		patentdata = data["data"];
		initClasses();
		//hide loader
		$('#data_loader').hide();
		//show main content container
		$('#main').show();

		$('#classes').show();
		$('#classes_loader').hide();
	});		
}

function initClasses() {
	var collated = [];
	//now using the master list
	for (var patentclass in legend_classes) {
		var found = _.filter(patentdata, function(row) {
			return ($.inArray(patentclass,row["classes"])!=-1);
		});
//console.log(found);						
		if (found.length>0) {
			var tmp = {};
			tmp["class"] = patentclass;
			tmp["title"] = legend_classes[patentclass];
			tmp["count"] = found.length;
			collated.push(tmp);
		}
	}

	//download 
	//prepare for datatable data - conv to array
	var aaData = _.map(collated, function(row) {
		return [row["class"], 'c'+row['class'], row["title"], row["count"]];
	});
//console.log(aaData);		

	var oTable = $('#classes_table').dataTable({
		//TableTools - copy, csv, print, pdf
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		//"sDom": 'T<"clear">lfrtip',
		//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "csv",
                    "sButtonText": "Export as CSV"
                }
            ]
        },
		"bDestroy": true,
		"bProcessing": true,
		"bAutoWidth": false,
		"iDisplayLength": 50,
		"aaData": aaData,
		"aoColumnDefs": [
			{
				"fnRender": function ( oObj ) {
					return '<input type="checkbox" name="class[]" value="'+oObj.aData[0]+'">';
				},
				"sClass": "center",
				"bUseRendered": false,
				"bSearchable": false,
				"bSortable": false,
				"sTitle": "Select",
				"aTargets": [ 0 ]
			},
			{
				"sTitle": "USPTO Class ID",
				"aTargets": [1]
			},
			{
				"sTitle": "Patent Class Description",
				"aTargets": [ 2 ]
			},
			{
				"sTitle": "Patents by NSF PIs",
				"aTargets": [3]
			}
		],
		"aaSorting": [[3, 'desc']],
		"oLanguage": {
			"sLengthMenu:": "Display _MENU_ records per page",
			"sSearch": "Keyword Filter:"
		}
	});
}

/** DATA **/
/*showTab */
/*
show tab

Param: tab (string)

Returns: JSON data
*/
function showTab(tab) {
	//filter downloaded patent data by selected classes
	var oTable = $('#classes_table').dataTable();		
	var selectedRows = fnGetSelected(oTable);
	var selected_classes = _.pluck(selectedRows,0);
//console.log(selected_classes);	
	//now using the master list
	var data = [];
	_.each(selected_classes, function(patentclass) {
//console.log(patentclass);		
		var found = _.filter(patentdata, function(row) {
			return ($.inArray(patentclass,row["classes"])!=-1);
		});
//console.log(found);						
		if (found.length>0) {
			_.each(found, function(row) {
				data.push(row);
			});
		}		
	});
//console.log(data);		
	//load data
	initData(tab, data);		
}

/* initData */
/*
tab data loaded into datatable

Param: tab (string), data (array)

Returns: JSON data
*/
function initData(tab,data) {
	var aaData = _.map(data, function(v) { 
		return [
			v["patent"],
			v["title"],
			v["classes"],
			v["application_year"], 
			v["grant_year"], 
			v["inventors"],
			v["assignee"],
			keyExists("abstract", v, null),
			keyExists("cited_by", v, []),
		]; 
	});
//console.log(aaData);

	var oTable = $('#patents_table').dataTable({
		//TableTools - copy, csv, print, pdf
		"bJQueryUI": true,
		"sPaginationType": "full_numbers",
		//"sDom": 'T<"clear">lfrtip',
		//"sDom": 'T<"clear"><"H"lfr>t<"F"ip>',
		"sDom": '<"H"lTfr>t<"F"ip>',
        "oTableTools": {
            "aButtons": [
                {
                    "sExtends":    "csv",
                    "sButtonText": "Export as CSV"
                }
            ]
        },
		"bDestroy": true,
		"bAutoWidth": false,
		"bProcessing": true,
		"iDisplayLength": 50,
		"aoColumnDefs": [
			{
				"fnRender": function (oObj) {
					return "<a href='http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&p=1&u=%2Fnetahtml%2FPTO%2Fsearch-bool.html&r=1&f=G&l=50&co1=AND&d=PTXT&s1="+oObj.aData[0]+".PN.&OS=PN/"+oObj.aData[0]+"&RS=PN/"+oObj.aData[0]+"' target='_blank'>"+oObj.aData[0]+'</a>';
				},
				"bUseRendered": false,
				"sTitle": "Patent (uspto)",
				"aTargets": [ 0 ],
				"sWidth": "50px"
			},
			{
				"sTitle": "Title",
				"aTargets": [ 1 ],
				"sWidth": "200px"
			},
			{
				"fnRender": function ( oObj ) {
					var collated = _.map(oObj.aData[2], function(item) { if (legend_classes[item]) return '<strong>c'+item+':</strong> '+legend_classes[item]; else return item; });
					return collated.join('<br /> ');
				},
				"sTitle": "Patent Classes",
				"aTargets": [ 2 ],
				"sWidth": "200px"
			},
			{
				"sTitle": "Appl. Year",
				"aTargets": [ 3 ],
				"sWidth": "50px"
			},
			{
				"sTitle": "Grant Year",
				"aTargets": [ 4 ],
				"sWidth": "50px"
			},
			{
				"fnRender": function ( oObj ) {
					var collated = _.map(oObj.aData[5], function(row) { 
						var tmp = row["name"]; 
						if (row["nsf_id"]) tmp = '<a href="#" id="pid_researcher_' + row["nsf_id"] + '">'+ tmp + '</a>'; 
						return '<li>'+tmp+'</li>';
					});
					//return collated.join('<br /> ');
					return '<ul>'+collated.join('')+'</ul>';
				},
				"sTitle": "Inventors",
				"aTargets": [ 5 ]
			},
			{
				"sTitle": "Assignee",
				"aTargets": [ 6 ],
				"sWidth": "50px"
			},
			{
				"sTitle": "Abstract",
				"bVisible": false,
				"aTargets": [ 7 ]
			},
			{
				"sTitle": "Cited By",
				"bVisible": false,
				"aTargets" : [8]
			},
			{
				"fnRender": function ( oObj ) {
					return '<a id="patent_details_'+oObj.aData[0]+'" class="patent_details show-details">Show</a>';
				},
				"sTitle": "Details",
				"bSearchable": false,
				"bSortable": false,
				"aTargets": [ 9 ]
			}
		],
		"aaData": aaData,
		"aaSorting": [[1, 'desc']],
		"oLanguage": {
			"sLengthMenu:": "Display _MENU_ records per page",
			"sSearch": "Keyword Filter:"
		}
	});

	//add a form element to the table header
	/*$('<div id="data_filter_application_year_container">By Application Year: <select name="data_filter_application_year"><option value="">Select One</option></select></div>').insertAfter('#patents_table_length');
	
	//group by application year
	var grouped = _.groupBy(data,'application_year');
//console.log(grouped);
	//compute totals
	var collated = [];
	for (var key in grouped) {
		collated.push(_.reduce(grouped[key], function(memo, row) {
			return {"year":key,"count":memo["count"]+1};
		},{"year":key,"count":0}));
	}
	//sort by year
	_.sortBy(collated,function(row) { return row["year"];});
	
	//populate the select drop down
	_.each(collated, function(item) {
		$("select[name=data_filter_application_year]").append('<option value='+item.year+'>'+item.year+ ' ('+item.count+')</option>');
	});*/

	//hide loader
//	$('#data_loader').hide();	
	//show
//	$('#main').show();	
	
	$('#patents_loader').hide();
	$('#patents').show();
	$('a#queryform_submit').removeClass("disabled");
			
	$('#'+tab+'_loader').hide();
}

/*
click on researcher link
	if details layer is not expanded
		show details layer
	show researcher details

click on row
	if details layer is already expanded
		hide researcher details
	else 
		show details layer

click on details link
	if details layer is already expanded
		hide researcher details
	else 
		show details layer
*/
function selectPatent(oTable,pi_node,elem,researcher_id) {
	if (pi_node != null) {
		if (researcher_id!=null) {
			if ( elem.html().match('Show') )
			{
				showPatentDetails(oTable,pi_node,elem);
			}
			var pData = oTable.fnGetData(pi_node);
			$("#pid_researcher_"+pData[0]).html("<div class='dataInnerts overflow' id='pi_" + researcher_id + "'><span id='pi_loader_"+researcher_id+"' class='loader'>Loading...</span><table><tr><td class='pi_details_user' id='userDetails_"+researcher_id+"'></td><td class='pi_details_prop'><span id='pi_summary_loader_"+researcher_id+"' class='loader'>Loading...</span><span id='pi_proposal_summary_"+researcher_id+"'></span></td><td><strong>Patents: <span id='pi_patents_loader_"+researcher_id+"'>Loading...</span></strong><span id='pi_patent_summary_"+researcher_id+"'></span></td></tr></table><table class='pi_details_proplist' id='pi_propList_"+researcher_id+"'></table><div id='pi_patents_" + researcher_id + "'><h3>Patents:</h3><table class='dataInnerts'><thead><tr><th>ID</th><th>Title</th><th>Application Year</th><th>Grant Year</th><th>Assignee</th></thead><tbody id='patents_rows_" + researcher_id + "'></tbody></table></div></div>");
			var researcherdetails = showResearcherDetails(oTable,pi_node,researcher_id);
		}
		else if ( elem.html().match('Hide') )
		{
			hidePatentDetails(oTable,pi_node,elem);
		}
		else
		{
			showPatentDetails(oTable,pi_node,elem);
		}
	}
}

function hidePatentDetails(oTable,pi_node,elem) {
	elem.html('Show');
	//set the class
	elem.removeClass('hide-details');
	elem.addClass('show-details');
	var pData = oTable.fnGetData(pi_node);
	$("#pid_" + pData[0]).slideUp(function() {
		oTable.fnClose(pi_node);
	});	
}

function showPatentDetails(oTable,pi_node,elem) {
	elem.html('Hide');
	//set the class
	elem.removeClass('show-details');
	elem.addClass('hide-details');

	var pData = oTable.fnGetData(pi_node);
	var tr_details = oTable.fnOpen(pi_node, "<div class='dataInnerts'><div id='pid_" + pData[0] + "'></div><div class='patent-citations'><span id='patent_cited_by_"+pData[0]+"'></span></div><div id='pid_researcher_"+pData[0]+"'></div></div>", 'details' );
	$(tr_details).addClass('details');
	$("#pid_" + pData[0]).hide();
	//show abstract
	$('#pid_'+pData[0]).html(pData[7]);
	//if citations
	if (pData[8].length>0) {
		//extract the proposal ids
		var propids = pData[8];
		var citations = [];
		_.each(propids, function(propid) {
			citations.push("<a href='http://patft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&p=1&u=%2Fnetahtml%2FPTO%2Fsearch-bool.html&r=1&f=G&l=50&co1=AND&d=PTXT&s1="+propid+".PN.&OS=PN/"+propid+"&RS=PN/"+propid+"' target='_blank'>"+propid+'</a>');
		});
		$('#patent_cited_by_'+pData[0]).html('Cited by: '+citations.join(', '));
	} else {
		$('#patent_cited_by_'+pData[0]).hide();
	}						
	$("#pid_" + pData[0]).slideDown();
}

/* General use functions */
function makeAPIQueryParamString() {
	//using query form, extract all the selected options into a dictionary
	var queryparams = [];
	//years
	queryparams.push('year='+$('select[name=filter_year]').val());

//console.log(queryparams);
	
	return queryparams.join('&');
}