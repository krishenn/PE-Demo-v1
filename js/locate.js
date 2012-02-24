function init() {
	//on page load
	$($('#topics_tabs_template').tmpl()).appendTo('#topics_tabs_container');
	$($('#topics_summary_template').tmpl()).appendTo('#topics_summary_container');

	//hide
	$('#topics_summary_collapsed').hide();
	$('#topics').hide();
	$('#data_container').hide();
	$('#topics_tabs').tabs();
	$('a[id^=topics_submit]').addClass('disabled');
	$('#topics_submit_awards').hide();
	$('#topics_submit_declines').hide();
	$('#topics_submit_proposed').hide();
	$('#topics_summary_propose_container').hide();
	$('#topics_summary_decline_container').hide();
	$('#topics_summary_award_container').hide();
	
	//load topic legend
	$.getJSON(apiurl+'topic?legend=topic'+'&jsoncallback=?', function(data) {
		_.each(data, function(item) {
			legend_topics[item["topic"]] = {"words":item["words"],"label":item["label"]};
		});
		var queryparams = makeAPIQueryParamString();
		queryparams += '&summ=status,t1';
		$('#topics').show();
		loadTopics(queryparams,true);
	});			

	//check year filter
	$('select[name="filter_year_from"]').focus(function() {
	    prev_val = $(this).val();
	}).change(function(event) {
		$(this).blur() // Firefox fix
		if ($(this).val()>$('select[name=filter_year_to] option:selected').val()) {
			alert('Year From - select a year prior to '+$('select[name=filter_year_to] option:selected').val());
			$(this).val(prev_val); //set back
			return false;
		}
	});
	$('select[name="filter_year_to"]').focus(function() {
	    prev_val = $(this).val();
	}).change(function(event) {
		$(this).blur() // Firefox fix
		if ($(this).val()<$('select[name=filter_year_from] option:selected').val()) {
			alert('Year To - select a year after '+$('select[name=filter_year_from] option:selected').val());
			$(this).val(prev_val); //set back
			return false;
		}
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

	/* queryform submit
		hide queryform
		set querysummary
		show querysummary
		load topics
		show topics
	*/
	$('a#queryform_submit').click(function() {
		if (!$(this).hasClass('disabled')) {		
			resetTopics();
			//load topics
			var queryparams = makeAPIQueryParamString();
			queryparams += '&summ=status,t1';
			$('#topics').show();
			loadTopics(queryparams,true);
		}
		
		return false;
	});
	
	/** topics **/
	/** topics datatable events **/
	/* multiselect checkbox click captured by generic function, triggered by multiselect class on checkbox */
	/* topic select checkbox
		mark datatable row as selected/unselected
		show/hide showresults buttons
		update selection summary
	*/
	$('input[name="topic[]"]').live('click',function() {
		var topicid = $(this).val();
	
		//update row selections
		if ($(this).attr('checked')) {
			setRowSelected($(this).parent().parent());
		} else {
			//set the class
			setRowUnSelected($(this).parent().parent());
		}
		
		//filter rawdata by selected topics
		var oTable = $('#topics_table').dataTable();
		var selectedRows = fnGetSelected(oTable);
		//get selected topics
		var selected_topics = _.pluck(selectedRows, 0);

		//reset
		resetTopicSummary();
		$('#topics_summary_researchers_count').html('');

		//show loading state
		$('#topics_summary_award_pge_loader').show();
		$('#topics_summary_award_org_loader').show();
		$('#topics_summary_award_year_loader').show();
		$('#topics_summary_decline_pge_loader').show();
		$('#topics_summary_decline_org_loader').show();
		$('#topics_summary_decline_year_loader').show();
		$('#topics_summary_propose_pge_loader').show();
		$('#topics_summary_propose_org_loader').show();
		$('#topics_summary_propose_year_loader').show();
		
		//update summary
		updateTopicSummary(selectedRows);

		//get additional summary data for div, pge, year, institutions, researchers
		if (selectedRows.length>0) {
			if ($(this).attr('checked')) {
				//for summary data that needs to be downloaded
				//make query params
				var queryparams = '';
				//years
				queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
				//status
				var tmp = '';
				if ($('input[name=filter_status]:checked').val()=='completed') {
					tmp = 'award';
					if (proposalaccessallowed) tmp += ',decline';
				}
				queryparams += '&status='+tmp;			

				//if summary data items not previously retrieved
					//retrieve them
						//store them
						//run the updater
				//else run the updater
				//pge
				if (_.any(topicsummarydata_pge, function(row) { return topicid==row["t1"]; })) {
					updateTopicSummaryData(topicsummarydata_pge, selected_topics,'pge');
				} else {
					var params = queryparams+'&t1='+topicid+"&summ=pge,status";
					$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
						//summarize the data before storing
						//group by pge
						var grouped = _.groupBy(data["data"],function(row) { return row["pge"]; });
					//console.log('grouped');		
					//console.log(grouped);		
						//now assemble and store in global variable
						for (var pge in grouped) {
							topicsummarydata_pge.push(summarizeTopicBy(topicid,pge,grouped[pge]));
						}
						updateTopicSummaryData(topicsummarydata_pge, selected_topics,'pge');						
					});
				}

				//org
				if (_.any(topicsummarydata_org, function(row) { return topicid==row["t1"]; })) {
					updateTopicSummaryData(topicsummarydata_org, selected_topics,'org');
				} else {
					var params = queryparams+'&t1='+topicid+"&summ=org,status";
					$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
						//summarize the data before storing
						//group by pge
						var grouped = _.groupBy(data["data"],function(row) { return row["org"]; });
					//console.log('grouped');		
					//console.log(grouped);		
						//now assemble and store in global variable
						for (var org in grouped) {
							topicsummarydata_org.push(summarizeTopicBy(topicid,org,grouped[org]));
						}
						updateTopicSummaryData(topicsummarydata_org, selected_topics,'org');
					});
				}

				//year
				if (_.any(topicsummarydata_year, function(row) { return topicid==row["t1"]; })) {
					updateTopicSummaryData(topicsummarydata_year, selected_topics,'year');
				} else {
					var params = queryparams+'&t1='+topicid+"&summ=year,status";
					$.getJSON(apiurl + 'topic?' + params + '&jsoncallback=?', function(data) {
						//summarize the data before storing
						//group by pge
						var grouped = _.groupBy(data["data"],function(row) { return row["year"]; });
					//console.log('grouped');		
					//console.log(grouped);		
						//now assemble and store in global variable
						for (var year in grouped) {
							topicsummarydata_year.push(summarizeTopicBy(topicid,year,grouped[year]));
						}
//console.log(topicsummarydata_year);						
						updateTopicSummaryData(topicsummarydata_year, selected_topics,'year');
					});
				}
			}
			else {
				//run the updaters
				updateTopicSummaryData(topicsummarydata_pge, selected_topics,'pge');
				updateTopicSummaryData(topicsummarydata_org, selected_topics,'org');
				updateTopicSummaryData(topicsummarydata_year, selected_topics,'year');
			}	
			//get count of researchers - we're not caching these for now
			var params = queryparams+'&t1='+selected_topics.join(',')+"&page=pi";
			$('#topics_summary_researchers_count').html('Updating...');
			$.getJSON(apiurl + 'topic?' + params + '&count' + '&jsoncallback=?', function(data) {
				$('#topics_summary_researchers_count').html(data["count"]);
				$('#topics_submit_researchers').removeClass('disabled');
			});		
		}
	});
	/* topic detail link
		show:
			read from preloaded data
			show topic detail
		hide:
			hide topic detail
	*/
	/*$('a[id^=topic_details_]').live('click',function() {
		if (!$(this).hasClass('disabled')) {		
			showTopicDetails(this);
		}
		
		return false;
	});*/
	$('#topics_table > tbody > tr:not(.topic-details)').live('click', function (event) {
		//if the show details link was clicked trap that		
	   if(event.target.nodeName == "A"){
			if ($(event.target).attr('id').substring(0, 14) != "topic_details_") {		
				return;
			} else {
				//toggle details
				showTopicDetails(event.target);
			}
			event.preventDefault();
		} else if (event.target.nodeName == "INPUT") return;
		else {
			var elem = $('a[id^="topic_details_"]', this);
//console.log(elem);			
			//toggle details
			showTopicDetails(elem.get(0)); //dom object, not jquery object
		}
	});
	
	$('#topics_selection_clear').click(function(event) {
		clearTopicSelection();
		$('#topics_summary_researchers_count').html('');
		event.preventDefault();
	})
	
	/** topicsummary **/
	/* change selection click
		hide topicsummary
		hide data
		show topics
	*/
	$('a#topics_summary_change').click(function() {
		if (!$(this).hasClass('disabled')) {		
			$('#topics').show();
			$('#data_container').hide();
			//set classes
			$('#topics_container').removeClass('collapsed');
			$('#topics_container').addClass('expanded');
			$('#results_container').removeClass('expanded');
			$('#results_container').addClass('collapsed');		
	
			//disable this until view topics is selected again
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
		one or more topics must be selected
		hide topics
		set topicsummary
		show topicsummary
		load data (based on target tab i.e. proposals, awards, researchers, institutions
		show data
	*/
	$('a[id^=topics_submit]').click(function() {
		if (!$(this).hasClass('disabled')) {
			var oTable = $('#topics_table').dataTable();		
			var selectedRows = fnGetSelected(oTable);
	//console.log(selectedRows);		
			if (selectedRows.length==0) { alert('Please select a topic'); return false; }
	//console.log(selectedRows);
			var selected_topics = _.map(selectedRows, function(item) {
				//return '<span><strong>t'+item[0]+':</strong>'+item[1]+'</span>';
				var tmp = item[1].split(' - ');
				return '<span>'+tmp[0]+'</span>';
			});
	//console.log(selected_orgs);		
		
			$('#topics').hide();
			//enable change selection button		
			$('a#topics_summary_change').removeClass('disabled');		
		
			//set topic summary
			$('#topics_summary_count_selected').html(selectedRows.length);
			$('#topics_summary_count').html(oTable.fnGetData().length);		
			$('#topics_summary_selected').html(selected_topics.join(''));		
			//years
			$('#topics_summary_filter_year_from').html($('select[name=filter_year_from] option:selected').text());
			$('#topics_summary_filter_year_to').html($('select[name=filter_year_to] option:selected').text());		
			$('#topics_summary_expanded').hide();
			$('#topics_summary_collapsed').show();
			//collapse topics
			$('#topics_container').removeClass('expanded');
			$('#topics_container').addClass('collapsed');
			//expand results
			$('#results_container').removeClass('collapsed');
			$('#results_container').addClass('expanded');
		
			//clear out existing data before showing to reset old results
			$('#researchers_table').empty();
			//clear out existing data summaries as well
			$('#summary_pis').html('');
			$('td[id^=summary_rankedpis_]').html('');
		
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
	
	/** researchers datatable **/
	$('#researchers_table > tbody > tr:not(.details)').live('click', function (event) {		 
		selectResearcher(this, event);
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
	//hide all summaries
	$('div[id^=data_summary_]').hide();
	//show the appropriate one
	$('div[id^=data_summary_'+tab+']').show();	
	
	//read the appropriate tab
	//is data already loaded in tab - show tab
	var numRows = $('#'+tab+'_table tr').length;
//console.log(tab+' numRows:'+numRows);	
	if (numRows==0) {
		//load data
		//make query params
		var queryparams = '';
		//years
		queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
		var oTable = $('#topics_table').dataTable();
		var selectedRows = fnGetSelected(oTable);
		//get selected topics
		var selected_topics = _.pluck(selectedRows, 0);
		//topicconfidence
		//topic operators OR or AND
		var topic_operator = ','; //$('select[name=filter_topic_operator] option:selected').val();
		//if ($('select[name=filter_topicconfidence] option:selected').val()=='primary') queryparams += '&t1='+selected_topics.join(topic_operator);
		//else queryparams += '&t1='+selected_topics.join(topic_operator);
		queryparams += '&t1='+selected_topics.join(topic_operator);
		var tmp = '';
		if ($('input[name=filter_status]:checked').val()=='completed') {
			tmp = 'award';
			if (proposalaccessallowed && $('select[name=filter_topic_operator] option:selected').val()!='+') tmp += ',decline';
		}
		queryparams += '&status='+tmp;
		//load data
		var page = 'pi';
		$('#'+tab+'_loader').show();
		$.getJSON(apiurl+'topic?' + queryparams + '&page=' + page + '&jsoncallback=?', function(data) {
			//if user selected more than one topic and specified OR
//console.log(selected_topics.length);		
//console.log($('select[name=filter_topic_operator] option:selected').val());	
			if (selected_topics.length>1 && $('select[name=filter_topic_operator] option:selected').val()=='+') {
				//prepare to extract the pis that have worked on awards in all the specified topics
				//do this by getting a list of proposals that appear in any of those buckets
				$.getJSON(apiurl+'topic?' + queryparams + '&jsoncallback=?', function(propdata) {
					//create buckets for the selected topics
					var collated = {};
					_.each(selected_topics, function(topicid) {
						collated[topicid]=[];
					});
//console.log(collated);					
					_.each(propdata["data"], function(row) {
//console.log(row);					
						//check all topics
						var i = 0;
//console.log(row["topic"]["id"][i]);						
						if (row["topic"]["id"][i] != null && $.inArray(row["topic"]["id"][i],selected_topics)!=-1) {
							var tmp = collated[row["topic"]["id"][i]];
							if ($.inArray(row["proposal"]["nsf_id"],tmp)==-1) { 
								tmp.push(row["proposal"]["nsf_id"]);
								collated[row["topic"]["id"][i]] = tmp;
							}
						}
						i = 1;
//console.log(row["topic"]["id"][i]);						
//console.log(selected_topics);
						if (row["topic"]["id"][i] != null && $.inArray(row["topic"]["id"][i],selected_topics)!=-1) {
							var tmp = collated[row["topic"]["id"][i]];
							if ($.inArray(row["proposal"]["nsf_id"],tmp)==-1) { 
								tmp.push(row["proposal"]["nsf_id"]);
								collated[row["topic"]["id"][i]] = tmp;
							}
						}
						i = 2;
						if (row["topic"]["id"][i] != null && $.inArray(row["topic"]["id"][i],selected_topics)!=-1) {
							var tmp = collated[row["topic"]["id"][i]];
							if ($.inArray(row["proposal"]["nsf_id"],tmp)==-1) { 
								tmp.push(row["proposal"]["nsf_id"]);
								collated[row["topic"]["id"][i]] = tmp;
							}
						}
						i = 3;
						if (row["topic"]["id"][i] != null && $.inArray(row["topic"]["id"][i],selected_topics)!=-1) {
							var tmp = collated[row["topic"]["id"][i]];
							if ($.inArray(row["proposal"]["nsf_id"],tmp)==-1) { 
								tmp.push(row["proposal"]["nsf_id"]);
								collated[row["topic"]["id"][i]] = tmp;
							}
						}
					});
//alert('done collation');
//console.log(collated);	
					//now get all the propids into an array
					var extracted = [];
					for (var key in collated) {
						extracted.push(collated[key]);
					}	
//console.log(extracted);										
//alert('done extraction');
					//now get the intersection of the propids across all the buckets, these are proposals that have all the topics assigned to them
					var propids = _.intersection(extracted[0],extracted[1]);
//console.log(propids);					
					if (propids.length>0) {
						//continue with the rest
						for (var i=2;i<extracted.length;i++) {
							propids = _.intersection(propids,extracted[i]);
							if (propids.length==0) break;
						}						
					}
//console.log(propids);										
//console.log(data["data"]);
//alert('done finding');
					//now go through the list of pis and the list of proposals the pi has worked on
					var pis = [];
					//if there are no common proposals, ignore
					if (propids.length>0) {						
						_.each(data["data"], function(row) {
							//if a pi has a prop that falls into the common award list, they qualify
							if (row["prop"] && row["prop"].length>0) { 
								// && _.intersection(propids, row["prop"]).length!=0) {
								for (var i=0;i<row["prop"].length;i++) {
									var propid = row["prop"][i];
									if ($.inArray(propid,propids)!=-1) {
										pis.push(row);
										break;
									}
								}
								//pis.push(row);
							}
						});
					}
//alert('done intersection');					
//console.log(pis);
					initData(tab, pis);
				});
			} else {		
				initData(tab, data["data"]);		
			}
		});		
	}
}

/* initData */
/*
tab data loaded into datatable

Param: tab (string), data (array)

Returns: JSON data
*/
function initData(tab,data) {
	if (tab == "researchers") {			
		initResearchers(data);
		//summarize data
		summarizeResearchers(data);
	}

	//custom export button
	//export using the same query params as we used to load the table
	//make query params
	var queryparams = '';
	//years
	queryparams = 'year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val();		
	var oTable = $('#topics_table').dataTable();
	var selectedRows = fnGetSelected(oTable);
	//get selected topics
	var selected_topics = _.pluck(selectedRows, 0);
	//topicconfidence
	//topic operators OR or AND
	var topic_operator = ','; //$('select[name=filter_topic_operator] option:selected').val();
	//if ($('select[name=filter_topicconfidence] option:selected').val()=='primary') queryparams += '&t1='+selected_topics.join(topic_operator);
	//else queryparams += '&t1='+selected_topics.join(topic_operator);
	queryparams += '&t1='+selected_topics.join(topic_operator);
	var tmp = '';
	if ($('input[name=filter_status]:checked').val()=='completed') {
		tmp = 'award';
		if (proposalaccessallowed && $('select[name=filter_topic_operator] option:selected').val()!='+') tmp += ',decline';
	}
	queryparams += '&status='+tmp;
	var exporturl = apiurl+'topic?'+queryparams+'&page=pi'+'&format=csv';
	$('<div class="export"><a href="'+exporturl+'">Export as CSV</a></div>').insertAfter('#'+tab+'_table_filter');

	$('#'+tab+'_loader').hide();
}

/* General use functions */
function makeAPIQueryParamString() {
	//using query form, extract all the selected options into a dictionary
	var queryparams = [];
	//status
	var tmp = '';
	if ($('input[name=filter_status]:checked').val()=='completed') {
		tmp = 'award';
		if (proposalaccessallowed) tmp += ',decline';
	}
	queryparams.push('status='+tmp);
	//years
	queryparams.push('year='+$('select[name=filter_year_from] option:selected').val()+'-'+$('select[name=filter_year_to] option:selected').val());

//console.log(queryparams);
	
	return queryparams.join('&');
}